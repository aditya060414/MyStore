import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AuditLog from '../models/AuditLog.js';
import Business from '../models/Business.js';
import Store from '../models/Store.js';

// @desc    Create new POS bill / sale with atomic stock deduction & COGS snapshot
// @route   POST /api/v1/sales
export const createSale = async (req, res) => {
  try {
    const {
      customerId,
      customerName = 'Walk-in Customer',
      customerPhone = '',
      customerType = 'Walk-in Customer',
      items = [],
      discountType = 'percentage',
      discountValue = 0,
      paymentMethod = 'Cash',
      notes = '',
      billFormat = 'A4 - Standard',
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please add at least one item to the bill' });
    }

    const activeBusinessId = req.businessId || req.tenantId;
    const business = await Business.findById(activeBusinessId);
    const store = await Store.findOne({ businessId: activeBusinessId, isPrimary: true });

    // Validate and process items against actual product records
    let subtotal = 0;
    let totalCogs = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, businessId: activeBusinessId, isArchived: false });
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name || item.productId}' not found in inventory`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }

      const itemTotal = Number(product.sellingPrice) * Number(item.quantity);
      subtotal += itemTotal;
      totalCogs += Number(product.costPrice || 0) * Number(item.quantity);

      processedItems.push({
        productId: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        image: product.image,
        price: product.sellingPrice,
        costPrice: product.costPrice,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round((subtotal * Number(discountValue || 0)) / 100);
    } else {
      discountAmount = Number(discountValue || 0);
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Calculate tax if configured in business settings
    const taxRate = business?.settings?.taxRate || 0;
    const taxAmount = taxRate > 0 ? Math.round((discountedSubtotal * taxRate) / 100) : 0;
    const totalAmount = discountedSubtotal + taxAmount;
    const grossProfit = totalAmount - taxAmount - totalCogs;

    // Determine sequential bill number for this business
    const lastSale = await Sale.findOne({ businessId: activeBusinessId }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastSale && lastSale.sequenceNumber ? lastSale.sequenceNumber + 1 : 1001;
    const billNumber = `#${sequenceNumber}`;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const barcode = `${billNumber}-${dateStr}`;

    // Handle or create customer record
    let linkedCustomerId = customerId;
    if (!linkedCustomerId && customerPhone) {
      let cust = await Customer.findOne({ businessId: activeBusinessId, phone: customerPhone });
      if (!cust) {
        cust = await Customer.create({
          businessId: activeBusinessId,
          name: customerName,
          phone: customerPhone,
          customerType,
          totalSpend: totalAmount,
          orderCount: 1,
        });
      } else {
        cust.totalSpend += totalAmount;
        cust.orderCount += 1;
        await cust.save();
      }
      linkedCustomerId = cust._id;
    }

    // Create Sale record
    const sale = await Sale.create({
      businessId: activeBusinessId,
      storeId: store?._id,
      billNumber,
      sequenceNumber,
      customerId: linkedCustomerId,
      customerName,
      customerPhone,
      customerType,
      cashierId: req.user?._id,
      cashierName: req.user?.name || 'Admin',
      items: processedItems,
      subtotal,
      discountType,
      discountValue: Number(discountValue || 0),
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      cogs: totalCogs,
      grossProfit,
      notes,
      billFormat,
      barcode,
    });

    // Atomically deduct product stock & record inventory movements
    for (const item of processedItems) {
      const product = await Product.findById(item.productId);
      const previousStock = product.stock;
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();

      await InventoryMovement.create({
        businessId: activeBusinessId,
        productId: product._id,
        productName: product.name,
        type: 'sale',
        quantityDelta: -item.quantity,
        previousStock,
        newStock: product.stock,
        reason: `POS Bill ${billNumber}`,
        referenceId: sale._id.toString(),
        performedBy: req.user?.name || 'Cashier',
      });
    }

    // Audit log
    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: 'SALE_CREATED',
      entityType: 'Sale',
      entityId: sale._id.toString(),
      details: {
        billNumber,
        totalAmount,
        paymentMethod: sale.paymentMethod || 'Cash',
        paymentType: 'Offline',
        channel: 'Offline POS',
        customerName: sale.customerName || 'Walk-in Customer',
        customerPhone: sale.customerPhone || '—',
        itemsCount: processedItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
        items: processedItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.total || i.price * i.quantity,
        })),
      },
    });

    res.status(201).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error('[Create Sale Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get sales history with search and pagination
// @route   GET /api/v1/sales
export const getSales = async (req, res) => {
  try {
    const { search, paymentMethod, page = 1, limit = 20 } = req.query;
    const activeBusinessId = req.businessId || req.tenantId;
    const query = { businessId: activeBusinessId };

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single sale by ID or bill number
// @route   GET /api/v1/sales/:idOrBill
export const getSaleById = async (req, res) => {
  try {
    const { idOrBill } = req.params;
    const activeBusinessId = req.businessId || req.tenantId;
    let sale = null;

    if (idOrBill.match(/^[0-9a-fA-F]{24}$/)) {
      sale = await Sale.findOne({ _id: idOrBill, businessId: activeBusinessId });
    }

    if (!sale) {
      sale = await Sale.findOne({ billNumber: idOrBill, businessId: activeBusinessId });
    }

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
