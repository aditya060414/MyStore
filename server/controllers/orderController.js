import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Tenant from '../models/Tenant.js';
import Store from '../models/Store.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get tenant online orders with filters, search, and stats
// @route   GET /api/v1/orders
export const getOrders = async (req, res) => {
  try {
    const { search, status, paymentMethod, page = 1, limit = 20 } = req.query;
    const query = { tenantId: req.tenantId };

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All Statuses' && status !== 'All Status') {
      query.orderStatus = status;
    }

    if (paymentMethod && paymentMethod !== 'All Payment Methods') {
      query.paymentMethod = paymentMethod;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    // Calculate order statistics for header cards
    const allTenantOrders = await Order.find({ tenantId: req.tenantId });
    const totalOrders = allTenantOrders.length;
    const deliveredCount = allTenantOrders.filter((o) => o.orderStatus === 'Delivered').length;
    const pendingCount = allTenantOrders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length;
    const cancelledCount = allTenantOrders.filter((o) => o.orderStatus === 'Cancelled').length;

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
        stats: {
          totalOrders,
          deliveredCount,
          pendingCount,
          cancelledCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) order.orderStatus = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: 'ORDER_STATUS_UPDATED',
      entityType: 'Order',
      entityId: order._id.toString(),
      details: { orderNumber: order.orderNumber, newStatus: status },
    });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public: Place an order from public storefront
// @route   POST /api/v1/orders/public/:storeSlug
export const createPublicOrder = async (req, res) => {
  try {
    const { storeSlug } = req.params;
    const { customer, items, paymentMethod = 'UPI', notes = '' } = req.body;

    if (!customer?.name || !customer?.phone || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer details and items are required' });
    }

    const store = await Store.findOne({ slug: storeSlug });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const tenant = await Tenant.findById(store.tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Verify products and calculate price securely on backend
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, tenantId: tenant._id, isArchived: false });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.name || ''} unavailable` });
      }

      const itemTotal = Number(product.sellingPrice) * Number(item.quantity);
      subtotal += itemTotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        price: product.sellingPrice,
        quantity: item.quantity,
        total: itemTotal,
      });

      // Deduct stock
      const prev = product.stock;
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();

      await InventoryMovement.create({
        tenantId: tenant._id,
        productId: product._id,
        productName: product.name,
        type: 'online_order',
        quantityDelta: -item.quantity,
        previousStock: prev,
        newStock: product.stock,
        reason: 'Online Storefront Order',
        performedBy: 'Online Customer',
      });
    }

    const lastOrder = await Order.findOne({ tenantId: tenant._id }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastOrder && lastOrder.sequenceNumber ? lastOrder.sequenceNumber + 1 : 1001;
    const orderNumber = `#ORD${sequenceNumber}`;

    const deliveryCharges = subtotal > 500 ? 0 : 30;
    const totalAmount = subtotal + deliveryCharges;

    const order = await Order.create({
      tenantId: tenant._id,
      storeId: store._id,
      orderNumber,
      sequenceNumber,
      customer,
      items: processedItems,
      subtotal,
      deliveryCharges,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'pending' : 'paid',
      orderStatus: 'Pending',
      notes,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Public Order Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public: Track order by order number
// @route   GET /api/v1/orders/public/track/:orderNumber
export const trackPublicOrder = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const formattedNumber = orderNumber.startsWith('#') ? orderNumber : `#${orderNumber}`;
    const order = await Order.findOne({ orderNumber: formattedNumber }).populate('storeId', 'name address phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
