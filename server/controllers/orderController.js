import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Business from '../models/Business.js';
import Store from '../models/Store.js';
import User from '../models/User.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AuditLog from '../models/AuditLog.js';

// @desc    Get business online orders with filters, search, and stats
// @route   GET /api/v1/orders
export const getOrders = async (req, res) => {
  try {
    const { search, status, paymentMethod, page = 1, limit = 20 } = req.query;
    const activeBusinessId = req.businessId || req.tenantId;
    const query = { businessId: activeBusinessId };

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
    const allBusinessOrders = await Order.find({ businessId: activeBusinessId });
    const totalOrders = allBusinessOrders.length;
    const deliveredCount = allBusinessOrders.filter((o) => o.orderStatus === 'Delivered').length;
    const pendingCount = allBusinessOrders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing').length;
    const cancelledCount = allBusinessOrders.filter((o) => o.orderStatus === 'Cancelled').length;

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
    const activeBusinessId = req.businessId || req.tenantId;
    const order = await Order.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) order.orderStatus = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    await AuditLog.create({
      businessId: activeBusinessId,
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

// @desc    Public storefront: Get store details & catalog
// @desc    Public storefront: Get store details & catalog
// @route   GET /api/v1/orders/public/:storeHandle
export const getPublicStoreCatalog = async (req, res) => {
  try {
    const rawIdentifier = req.params.storeHandle || req.params.storeSlug;
    const cleaned = decodeURIComponent(rawIdentifier).trim().toLowerCase();
    const formattedHandle = cleaned.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const handleRegex = new RegExp(`^${formattedHandle.replace(/-/g, '[- ]?')}$`, 'i');
    const nameRegex = new RegExp(`^${cleaned.replace(/-/g, ' ')}$`, 'i');

    let store = await Store.findOne({
      $or: [
        { handle: rawIdentifier },
        { slug: rawIdentifier },
        { handle: formattedHandle },
        { slug: formattedHandle },
        { handle: handleRegex },
        { slug: handleRegex },
        { name: nameRegex },
      ],
      isActive: true,
    });
    let business;

    if (store) {
      business = await Business.findById(store.businessId);
    } else {
      business = await Business.findOne({
        $or: [
          { handle: rawIdentifier },
          { slug: rawIdentifier },
          { handle: formattedHandle },
          { slug: formattedHandle },
          { handle: handleRegex },
          { slug: handleRegex },
          { name: nameRegex },
        ],
        status: { $ne: 'suspended' },
      });
      if (business) {
        store = await Store.findOne({ businessId: business._id, isActive: true });
      } else {
        // Match owner's user name
        const ownerNameQuery = cleaned.replace(/-store$/i, '').replace(/-/g, ' ');
        const user = await User.findOne({ name: new RegExp(`^${ownerNameQuery}$`, 'i') });
        if (user) {
          business = await Business.findOne({ ownerId: user._id });
          if (business) {
            store = await Store.findOne({ businessId: business._id, isActive: true });
          }
        }
      }
    }

    if (!store && !business) {
      store = (await Store.findOne({ isPrimary: true, isActive: true })) || (await Store.findOne({ isActive: true }));
      if (store) {
        business = await Business.findById(store.businessId);
      }
    }

    if (!store && !business) {
      return res.status(404).json({ success: false, message: 'Store storefront not found' });
    }

    const resolvedHandle = store?.handle || store?.slug || business?.handle || business?.slug || formattedHandle;
    const businessId = business?._id || store?.businessId;
    const products = await Product.find({
      businessId,
      isArchived: false,
    }).sort({ stock: -1, createdAt: -1 });

    const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

    res.json({
      success: true,
      data: {
        store: {
          name: store?.name || business?.name || 'Store',
          handle: resolvedHandle,
          storeHandle: resolvedHandle,
          slug: resolvedHandle,
          phone: store?.phone || business?.contactPhone || '',
          email: store?.email || business?.contactEmail || '',
          address: store?.address
            ? `${store.address.street || ''}, ${store.address.city || ''}`
            : '',
          currencySymbol: business?.currencySymbol || '₹',
        },
        categories,
        products,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Public storefront: Create online order from shared customer link
// @route   POST /api/v1/orders/public/:storeHandle
export const createPublicOrder = async (req, res) => {
  try {
    const rawIdentifier = req.params.storeHandle || req.params.storeSlug;
    const { customer, items = [], paymentMethod = 'UPI', notes = '' } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
    }

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
    }

    const cleaned = decodeURIComponent(rawIdentifier).trim().toLowerCase();
    const formattedHandle = cleaned.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const handleRegex = new RegExp(`^${formattedHandle.replace(/-/g, '[- ]?')}$`, 'i');
    const nameRegex = new RegExp(`^${cleaned.replace(/-/g, ' ')}$`, 'i');

    let store = await Store.findOne({
      $or: [
        { handle: rawIdentifier },
        { slug: rawIdentifier },
        { handle: formattedHandle },
        { slug: formattedHandle },
        { handle: handleRegex },
        { slug: handleRegex },
        { name: nameRegex },
      ],
      isActive: true,
    });
    let business;

    if (store) {
      business = await Business.findById(store.businessId);
    } else {
      business = await Business.findOne({
        $or: [
          { handle: rawIdentifier },
          { slug: rawIdentifier },
          { handle: formattedHandle },
          { slug: formattedHandle },
          { handle: handleRegex },
          { slug: handleRegex },
          { name: nameRegex },
        ],
        status: { $ne: 'suspended' },
      });
      if (business) {
        store = await Store.findOne({ businessId: business._id, isActive: true });
      } else {
        const ownerNameQuery = cleaned.replace(/-store$/i, '').replace(/-/g, ' ');
        const user = await User.findOne({ name: new RegExp(`^${ownerNameQuery}$`, 'i') });
        if (user) {
          business = await Business.findOne({ ownerId: user._id });
          if (business) {
            store = await Store.findOne({ businessId: business._id, isActive: true });
          }
        }
      }
    }

    if (!store || !business) {
      store = (await Store.findOne({ isPrimary: true, isActive: true })) || (await Store.findOne({ isActive: true }));
      if (store) {
        business = await Business.findById(store.businessId);
      }
    }

    if (!store || !business) {
      return res.status(404).json({ success: false, message: 'Store storefront not found' });
    }

    if (business.status === 'suspended') {
      return res.status(400).json({ success: false, message: 'This store is temporarily not taking online orders' });
    }

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, businessId: business._id, isArchived: false });
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
        businessId: business._id,
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

    const lastOrder = await Order.findOne({ businessId: business._id }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastOrder && lastOrder.sequenceNumber ? lastOrder.sequenceNumber + 1 : 1001;
    const orderNumber = `#ORD${sequenceNumber}`;

    const deliveryCharges = subtotal > 500 ? 0 : 30;
    const totalAmount = subtotal + deliveryCharges;

    const order = await Order.create({
      businessId: business._id,
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

    await AuditLog.create({
      businessId: business._id,
      userId: null,
      userName: customer.name || 'Online Customer',
      action: 'ORDER_CREATED',
      entityType: 'Order',
      entityId: order._id.toString(),
      details: {
        orderNumber,
        billNumber: orderNumber,
        totalAmount,
        paymentMethod,
        paymentType: 'Online',
        channel: 'Online Storefront',
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || '',
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
