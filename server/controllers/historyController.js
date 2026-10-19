import AuditLog from '../models/AuditLog.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Business from '../models/Business.js';
import Sale from '../models/Sale.js';
import Order from '../models/Order.js';

// @desc    Get audit history and activity stream
// @route   GET /api/v1/history
export const getHistory = async (req, res) => {
  try {
    const { action, search, page = 1, limit = 50 } = req.query;
    const activeBusinessId = req.businessId || req.tenantId;

    let businessIds = activeBusinessId ? [activeBusinessId] : [];
    if (req.user) {
      const ownedBusinesses = await Business.find({ ownerId: req.user._id }).select('_id');
      const ownedIds = ownedBusinesses.map((b) => b._id);
      businessIds = Array.from(new Set([...businessIds.map((id) => id.toString()), ...ownedIds.map((id) => id.toString())]));
    }

    const baseConditions = [];
    if (businessIds.length > 0) {
      baseConditions.push({ businessId: { $in: businessIds } });
    }
    if (req.user?._id) {
      baseConditions.push({ userId: req.user._id });
    }

    let query = baseConditions.length > 0 ? { $or: baseConditions } : {};

    if (action && action !== 'All') {
      query = { $and: [query, { action }] };
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query = {
        $and: [
          query,
          {
            $or: [
              { userName: searchRegex },
              { action: searchRegex },
              { entityType: searchRegex },
              { 'details.businessName': searchRegex },
              { 'details.storeName': searchRegex },
              { 'details.plan': searchRegex },
              { 'details.productName': searchRegex },
              { 'details.reason': searchRegex },
              { 'details.billNumber': searchRegex },
              { 'details.orderNumber': searchRegex },
              { 'details.customerName': searchRegex },
            ],
          },
        ],
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    // Also fetch recent inventory movements for quick tab switching
    const movementQuery = businessIds.length > 0 ? { businessId: { $in: businessIds } } : {};
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      movementQuery.$or = [
        { productName: searchRegex },
        { reason: searchRegex },
        { type: searchRegex },
        { performedBy: searchRegex },
      ];
    }

    const movements = await InventoryMovement.find(movementQuery)
      .sort({ createdAt: -1 })
      .limit(50);

    // Fetch payments (both Offline POS Sales and Online Storefront Orders)
    const paymentQuery = businessIds.length > 0 ? { businessId: { $in: businessIds } } : {};
    const [sales, orders] = await Promise.all([
      Sale.find(paymentQuery).sort({ createdAt: -1 }).limit(100).lean(),
      Order.find(paymentQuery).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const formattedSales = (sales || []).map((s) => ({
      _id: s._id.toString(),
      id: s._id.toString(),
      channel: 'Offline',
      channelType: 'offline',
      channelLabel: 'Offline POS',
      billNumber: s.billNumber || `POS-${s.sequenceNumber || 1001}`,
      customerName: s.customerName || 'Walk-in Customer',
      customerPhone: s.customerPhone || '—',
      customerEmail: '',
      customerAddress: '',
      customerType: s.customerType || 'Walk-in Customer',
      paymentMethod: s.paymentMethod || 'Cash',
      paymentStatus: s.paymentStatus || 'paid',
      items: (s.items || []).map((it) => ({
        name: it.name,
        brand: it.brand || '',
        category: it.category || '',
        price: it.price,
        quantity: it.quantity,
        total: it.total || it.price * it.quantity,
      })),
      itemsCount: (s.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
      subtotal: s.subtotal || s.totalAmount,
      taxAmount: s.taxAmount || 0,
      discountAmount: s.discountAmount || 0,
      deliveryCharges: 0,
      totalAmount: s.totalAmount,
      cashierName: s.cashierName || 'Cashier',
      createdAt: s.createdAt,
    }));

    const formattedOrders = (orders || []).map((o) => ({
      _id: o._id.toString(),
      id: o._id.toString(),
      channel: 'Online',
      channelType: 'online',
      channelLabel: 'Online Storefront',
      billNumber: o.orderNumber || `ORD-${o.sequenceNumber || 1001}`,
      customerName: o.customer?.name || 'Online Customer',
      customerPhone: o.customer?.phone || '—',
      customerEmail: o.customer?.email || '',
      customerAddress: o.customer?.deliveryAddress || '',
      customerType: 'Online Customer',
      paymentMethod: o.paymentMethod || 'UPI',
      paymentStatus: o.paymentStatus || 'paid',
      orderStatus: o.orderStatus || 'Delivered',
      items: (o.items || []).map((it) => ({
        name: it.name,
        brand: '',
        category: '',
        price: it.price,
        quantity: it.quantity,
        total: it.total || it.price * it.quantity,
      })),
      itemsCount: (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
      subtotal: o.subtotal || o.totalAmount,
      taxAmount: 0,
      discountAmount: o.discount || 0,
      deliveryCharges: o.deliveryCharges || 0,
      totalAmount: o.totalAmount,
      cashierName: 'Online Storefront',
      createdAt: o.createdAt,
    }));

    let payments = [...formattedSales, ...formattedOrders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      payments = payments.filter((p) =>
        (p.billNumber && p.billNumber.toLowerCase().includes(q)) ||
        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
        (p.customerPhone && p.customerPhone.toLowerCase().includes(q)) ||
        (p.channel && p.channel.toLowerCase().includes(q)) ||
        (p.channelLabel && p.channelLabel.toLowerCase().includes(q)) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
        (p.items && p.items.some((i) => i.name.toLowerCase().includes(q)))
      );
    }

    res.json({
      success: true,
      data: {
        logs,
        movements,
        payments,
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
