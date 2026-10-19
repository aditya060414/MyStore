import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AuditLog from '../models/AuditLog.js';
import Business from '../models/Business.js';

// @desc    Get products with search, filtering, and pagination
// @route   GET /api/v1/products
export const 
getProducts = async (req, res) => {
  try {
    const { search, category, brand, stockStatus, page = 1, limit = 50 } = req.query;
    const activeBusinessId = req.businessId || req.tenantId;

    const query = { businessId: activeBusinessId, isArchived: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All Categories') {
      query.category = category;
    }

    if (brand && brand !== 'All Brands') {
      query.brand = brand;
    }

    if (stockStatus) {
      if (stockStatus === 'Low Stock') {
        query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
      } else if (stockStatus === 'Out of Stock') {
        query.stock = { $lte: 0 };
      } else if (stockStatus === 'In Stock') {
        query.stock = { $gt: 0 };
      } else if (stockStatus === 'Expiring Soon') {
        const fifteenDaysLater = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        query.expiryDate = { $lte: fifteenDaysLater, $gte: new Date() };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    // Calculate inventory stats
    const allBusinessProducts = await Product.find({ businessId: activeBusinessId, isArchived: false });
    const totalItems = allBusinessProducts.length;
    const lowStockItems = allBusinessProducts.filter((p) => p.stock <= p.lowStockThreshold).length;
    const categoriesSet = new Set(allBusinessProducts.map((p) => p.category).filter(Boolean));
    const categoriesCount = categoriesSet.size;

    const fifteenDaysFromNow = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = allBusinessProducts.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) <= fifteenDaysFromNow && new Date(p.expiryDate) >= new Date()
    ).length;

    // Unique categories and brands for filter dropdowns
    const categories = Array.from(categoriesSet);
    const brands = Array.from(new Set(allBusinessProducts.map((p) => p.brand).filter(Boolean)));

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
        stats: {
          totalItems,
          lowStockItems,
          categoriesCount,
          expiringSoonCount,
        },
        filters: {
          categories,
          brands,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product by ID or Barcode
// @route   GET /api/v1/products/:idOrBarcode
export const getProduct = async (req, res) => {
  try {
    const { idOrBarcode } = req.params;
    const activeBusinessId = req.businessId || req.tenantId;

    let product = null;
    if (idOrBarcode.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: idOrBarcode, businessId: activeBusinessId, isArchived: false });
    }

    if (!product) {
      product = await Product.findOne({ barcode: idOrBarcode, businessId: activeBusinessId, isArchived: false });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
export const createProduct = async (req, res) => {
  try {
    const { name, brand, category, sku, barcode, sellingPrice, costPrice, stock, lowStockThreshold, expiryDate, image } = req.body;
    const activeBusinessId = req.businessId || req.tenantId;

    if (!name || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name and selling price are required' });
    }

    // Check plan product limits
    const business = await Business.findById(activeBusinessId).populate('planId');
    const currentProductCount = await Product.countDocuments({ businessId: activeBusinessId, isArchived: false });
    const maxProducts = business.planId?.limits?.maxProducts || 50;

    if (currentProductCount >= maxProducts) {
      return res.status(403).json({
        success: false,
        message: `Plan limit reached (${maxProducts} products). Upgrade your plan to add more inventory items.`,
      });
    }

    const product = await Product.create({
      businessId: activeBusinessId,
      name,
      brand: brand || 'General',
      category: category || 'General',
      sku: sku || `SKU-${Date.now()}`,
      barcode: barcode || `${Date.now()}`,
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice || 0),
      stock: Number(stock || 0),
      lowStockThreshold: Number(lowStockThreshold || 5),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
    });

    if (Number(stock) > 0) {
      const performedBy = req.user ? req.user.name : 'Merchant';
      await InventoryMovement.create({
        businessId: activeBusinessId,
        productId: product._id,
        productName: product.name,
        type: 'initial',
        quantityDelta: Number(stock),
        previousStock: 0,
        newStock: Number(stock),
        reason: 'Initial stock on creation',
        performedBy,
      });

      await AuditLog.create({
        businessId: activeBusinessId,
        userId: req.user?._id,
        userName: performedBy,
        action: 'PRODUCT_CREATED',
        entityType: 'Product',
        entityId: product._id.toString(),
        details: {
          productName: product.name,
          type: 'initial',
          quantityDelta: `+${stock}`,
          previousStock: 0,
          newStock: Number(stock),
          reason: 'Initial stock on creation',
          performedBy,
        },
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add stock to product (adds to previous stock)
// @route   POST /api/v1/products/:id/stock
export const addProductStock = async (req, res) => {
  try {
    const { quantityToAdd, reason } = req.body;
    const activeBusinessId = req.businessId || req.tenantId;

    const qty = Number(quantityToAdd);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid quantity to add (must be greater than 0)',
      });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      businessId: activeBusinessId,
      isArchived: false,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = Number(product.stock || 0);
    const newStock = previousStock + qty;

    product.stock = newStock;
    await product.save();

    const note = reason?.trim() || 'Stock added by merchant';
    const performedBy = req.user ? req.user.name : 'Merchant';

    // 1. Record stock movement
    const movement = await InventoryMovement.create({
      businessId: activeBusinessId,
      productId: product._id,
      productName: product.name,
      type: 'restock',
      quantityDelta: qty,
      previousStock,
      newStock,
      reason: note,
      performedBy,
    });

    // 2. Record audit activity
    const auditLog = await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: performedBy,
      action: 'INVENTORY_ADJUSTED',
      entityType: 'Product',
      entityId: product._id.toString(),
      details: {
        productName: product.name,
        type: 'restock',
        quantityDelta: `+${qty}`,
        previousStock,
        newStock,
        reason: note,
        performedBy,
      },
    });

    res.json({
      success: true,
      message: `Successfully added ${qty} units to ${product.name}. Stock updated from ${previousStock} to ${newStock}.`,
      data: {
        product,
        movement,
        auditLog,
      },
    });
  } catch (error) {
    console.error('[Add Product Stock Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
export const updateProduct = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const product = await Product.findOne({ _id: req.params.id, businessId: activeBusinessId, isArchived: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = Number(product.stock || 0);
    let delta = 0;
    let isStockUpdated = false;
    let movementType = 'adjustment';
    let reason = req.body.adjustmentReason || 'Manual inventory update';

    // Support stockToAdd (adding directly to previous stock)
    if (req.body.stockToAdd !== undefined && req.body.stockToAdd !== null && req.body.stockToAdd !== '') {
      const addedQty = Number(req.body.stockToAdd);
      if (!isNaN(addedQty) && addedQty !== 0) {
        delta = addedQty;
        const newStock = previousStock + delta;
        req.body.stock = newStock;
        delete req.body.stockToAdd;
        isStockUpdated = true;
        movementType = delta > 0 ? 'restock' : 'adjustment';
        reason = req.body.adjustmentReason || (delta > 0 ? 'Stock added by merchant' : 'Stock reduced by merchant');
      }
    } else if (req.body.stock !== undefined && Number(req.body.stock) !== previousStock) {
      const newStock = Number(req.body.stock);
      delta = newStock - previousStock;
      isStockUpdated = true;
      movementType = delta > 0 ? 'restock' : 'adjustment';
      reason = req.body.adjustmentReason || 'Manual stock update';
    }

    Object.assign(product, req.body);
    await product.save();

    const performedBy = req.user ? req.user.name : 'Merchant';

    // Check if stock changed manually
    if (isStockUpdated) {
      await InventoryMovement.create({
        businessId: activeBusinessId,
        productId: product._id,
        productName: product.name,
        type: movementType,
        quantityDelta: delta,
        previousStock,
        newStock: product.stock,
        reason,
        performedBy,
      });

      await AuditLog.create({
        businessId: activeBusinessId,
        userId: req.user?._id,
        userName: performedBy,
        action: 'INVENTORY_ADJUSTED',
        entityType: 'Product',
        entityId: product._id.toString(),
        details: {
          productName: product.name,
          type: movementType,
          quantityDelta: delta > 0 ? `+${delta}` : `${delta}`,
          previousStock,
          newStock: product.stock,
          reason,
          performedBy,
        },
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Archive/delete product
// @route   DELETE /api/v1/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const product = await Product.findOne({ _id: req.params.id, businessId: activeBusinessId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isArchived = true;
    await product.save();

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
