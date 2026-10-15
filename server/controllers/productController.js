import Product from '../models/Product.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AuditLog from '../models/AuditLog.js';
import Tenant from '../models/Tenant.js';

// @desc    Get products with search, filtering, and pagination
// @route   GET /api/v1/products
export const getProducts = async (req, res) => {
  try {
    const { search, category, brand, stockStatus, page = 1, limit = 50 } = req.query;

    const query = { tenantId: req.tenantId, isArchived: false };

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
    const allTenantProducts = await Product.find({ tenantId: req.tenantId, isArchived: false });
    const totalItems = allTenantProducts.length;
    const lowStockItems = allTenantProducts.filter((p) => p.stock <= p.lowStockThreshold).length;
    const categoriesSet = new Set(allTenantProducts.map((p) => p.category).filter(Boolean));
    const categoriesCount = categoriesSet.size;

    const fifteenDaysFromNow = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const expiringSoonCount = allTenantProducts.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) <= fifteenDaysFromNow && new Date(p.expiryDate) >= new Date()
    ).length;

    // Unique categories and brands for filter dropdowns
    const categories = Array.from(categoriesSet);
    const brands = Array.from(new Set(allTenantProducts.map((p) => p.brand).filter(Boolean)));

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

    let product = null;
    if (idOrBarcode.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({ _id: idOrBarcode, tenantId: req.tenantId, isArchived: false });
    }

    if (!product) {
      product = await Product.findOne({ barcode: idOrBarcode, tenantId: req.tenantId, isArchived: false });
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

    if (!name || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name and selling price are required' });
    }

    // Check plan product limits
    const tenant = await Tenant.findById(req.tenantId).populate('planId');
    const currentProductCount = await Product.countDocuments({ tenantId: req.tenantId, isArchived: false });
    const maxProducts = tenant.planId?.limits?.maxProducts || 50;

    if (currentProductCount >= maxProducts) {
      return res.status(403).json({
        success: false,
        message: `Plan limit reached (${maxProducts} products). Upgrade your plan to add more inventory items.`,
      });
    }

    const product = await Product.create({
      tenantId: req.tenantId,
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
      await InventoryMovement.create({
        tenantId: req.tenantId,
        productId: product._id,
        productName: product.name,
        type: 'initial',
        quantityDelta: Number(stock),
        previousStock: 0,
        newStock: Number(stock),
        reason: 'Initial stock on creation',
        performedBy: req.user ? req.user.name : 'Merchant',
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId, isArchived: false });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.stock;
    Object.assign(product, req.body);
    await product.save();

    // Check if stock changed manually
    if (req.body.stock !== undefined && Number(req.body.stock) !== previousStock) {
      const delta = Number(req.body.stock) - previousStock;
      await InventoryMovement.create({
        tenantId: req.tenantId,
        productId: product._id,
        productName: product.name,
        type: 'adjustment',
        quantityDelta: delta,
        previousStock,
        newStock: product.stock,
        reason: req.body.adjustmentReason || 'Manual inventory update',
        performedBy: req.user ? req.user.name : 'Merchant',
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
    const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
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
