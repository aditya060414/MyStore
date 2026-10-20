import Customer from '../models/Customer.js';
import CustomerPayment from '../models/CustomerPayment.js';
import CustomerLedger from '../models/CustomerLedger.js';
import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import Business from '../models/Business.js';
import AuditLog from '../models/AuditLog.js';

// Helper: Normalize phone numbers (strips extra spaces, dashes, etc.)
const normalizePhone = (phone = '') => {
  return String(phone).replace(/[^\d+]/g, '').trim();
};

// @desc    Get all customers with search, filters, sorting & summary cards
// @route   GET /api/v1/customers
export const getCustomers = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const {
      search = '',
      customerType,
      status = 'Active',
      hasDues,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 15,
    } = req.query;

    const query = { businessId: activeBusinessId };

    // Status filter
    if (status && status !== 'All') {
      if (status === 'Active') {
        query.status = { $ne: 'Archived' };
      } else {
        query.status = status;
      }
    }

    // Customer Type filter
    if (customerType && customerType !== 'All') {
      query.customerType = customerType;
    }

    // Has Dues filter
    if (hasDues === 'true') {
      query.outstandingDue = { $gt: 0 };
    } else if (hasDues === 'false') {
      query.outstandingDue = { $lte: 0 };
    }

    // Search query across name, phone, email
    if (search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
      ];
    }

    // Sorting
    const sort = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'name') sort.name = order;
    else if (sortBy === 'lastPurchaseDate') sort.lastPurchaseDate = order;
    else if (sortBy === 'totalSpend') sort.totalSpend = order;
    else if (sortBy === 'outstandingDue') sort.outstandingDue = order;
    else sort.createdAt = order;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query).sort(sort).skip(skip).limit(Number(limit));

    // Calculate Summary Statistics for Business
    const allCustomers = await Customer.find({ businessId: activeBusinessId });
    const totalCustomers = allCustomers.length;
    const activeCustomers = allCustomers.filter((c) => c.status !== 'Archived').length;
    const customersWithDues = allCustomers.filter((c) => c.status !== 'Archived' && (c.outstandingDue || 0) > 0).length;
    const totalOutstandingAmount = allCustomers
      .filter((c) => c.status !== 'Archived')
      .reduce((sum, c) => sum + (c.outstandingDue || 0), 0);

    // New Customers This Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = allCustomers.filter((c) => new Date(c.createdAt) >= startOfMonth).length;

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
        summaryCards: {
          totalCustomers,
          activeCustomers,
          customersWithDues,
          totalOutstandingAmount,
          newCustomersThisMonth,
        },
      },
    });
  } catch (error) {
    console.error('[Get Customers Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fast customer search for POS autocomplete
// @route   GET /api/v1/customers/search
export const searchCustomers = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const { q = '' } = req.query;

    if (!q || !q.trim()) {
      return res.json({ success: true, data: [] });
    }

    const s = q.trim();
    const customers = await Customer.find({
      businessId: activeBusinessId,
      status: 'Active',
      $or: [{ name: { $regex: s, $options: 'i' } }, { phone: { $regex: s, $options: 'i' } }],
    })
      .sort({ lastPurchaseDate: -1, totalSpend: -1 })
      .limit(10);

    const formatted = customers.map((c) => ({
      _id: c._id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      customerType: c.customerType,
      outstandingDue: c.outstandingDue || 0,
      paymentTerms: c.paymentTerms || 'Due on Receipt',
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[Search Customers Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single customer profile with comprehensive financial metrics
// @route   GET /api/v1/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Calculate live overdue balance from sales with due date passed
    const now = new Date();
    const unpaidSales = await Sale.find({
      businessId: activeBusinessId,
      customerId: customer._id,
      balanceDue: { $gt: 0 },
    });

    const overdueBalance = unpaidSales
      .filter((s) => s.dueDate && new Date(s.dueDate) < now)
      .reduce((sum, s) => sum + (s.balanceDue || 0), 0);

    // Earliest upcoming due date
    const pendingDueSales = unpaidSales
      .filter((s) => s.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const nextDueDate = pendingDueSales.length > 0 ? pendingDueSales[0].dueDate : null;

    // Completed purchases count and avg order value
    const completedSalesCount = await Sale.countDocuments({
      businessId: activeBusinessId,
      customerId: customer._id,
    });
    const completedOrdersCount = await Order.countDocuments({
      businessId: activeBusinessId,
      'customer.phone': customer.phone,
      orderStatus: { $ne: 'Cancelled' },
    });

    const totalOrdersCount = completedSalesCount + completedOrdersCount;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round((customer.totalSpend || 0) / totalOrdersCount) : 0;
    // Determine due status
    let dueStatus = 'Paid';
    if ((customer.outstandingDue || 0) > 0) {
      if (overdueBalance > 0) {
        dueStatus = 'Overdue';
      } else if (customer.totalPaid > 0) {
        dueStatus = 'Partial Payment';
      } else {
        dueStatus = 'Due';
      }
    }

    res.json({
      success: true,
      data: {
        customer,
        metrics: {
          totalSpend: customer.totalSpend || 0,
          totalPaid: customer.totalPaid || 0,
          outstandingDue: customer.outstandingDue || 0,
          overdueBalance,
          nextDueDate,
          totalOrdersCount,
          completedSalesCount,
          completedOrdersCount,
          avgOrderValue,
          dueStatus,
        },
      },
    });
  } catch (error) {
    console.error('[Get Customer By Id Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new customer with duplicate phone detection
// @route   POST /api/v1/customers
export const createCustomer = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const {
      name,
      phone,
      email = '',
      billingAddress = '',
      deliveryAddress = '',
      address = '',
      notes = '',
      creditLimit = 0,
      paymentTerms = 'Due on Receipt',
      customerType = 'Offline',
      openingBalance = 0,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Customer phone number is required' });
    }

    const cleanPhone = normalizePhone(phone);

    // Prevent duplicate phone in same business; offer existing record
    const existing = await Customer.findOne({ businessId: activeBusinessId, phone: cleanPhone });
    if (existing) {
      return res.status(409).json({
        success: false,
        duplicate: true,
        message: `A customer with phone number ${cleanPhone} already exists: "${existing.name}".`,
        existingCustomer: existing,
      });
    }

    const initialDue = Math.max(0, Number(openingBalance || 0));

    const customer = await Customer.create({
      businessId: activeBusinessId,
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim().toLowerCase(),
      billingAddress: billingAddress.trim(),
      deliveryAddress: deliveryAddress.trim(),
      address: address.trim() || billingAddress.trim(),
      notes: notes.trim(),
      creditLimit: Number(creditLimit || 0),
      paymentTerms,
      customerType,
      status: 'Active',
      totalSpend: initialDue,
      outstandingDue: initialDue,
      totalPaid: 0,
      orderCount: 0,
    });

    // If opening balance > 0, record initial ledger debit
    if (initialDue > 0) {
      await CustomerLedger.create({
        businessId: activeBusinessId,
        customerId: customer._id,
        date: new Date(),
        reference: 'OPENING-BAL',
        transactionType: 'Opening Balance',
        debit: initialDue,
        credit: 0,
        runningBalance: initialDue,
        sourceType: 'Opening',
        notes: 'Initial opening balance',
        recordedBy: {
          id: req.user?._id,
          name: req.user?.name || 'Staff',
        },
      });
    }

    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone, openingBalance: initialDue },
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('[Create Customer Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update customer details, credit limit & payment terms
// @route   PUT /api/v1/customers/:id
export const updateCustomer = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const {
      name,
      phone,
      email,
      billingAddress,
      deliveryAddress,
      address,
      notes,
      creditLimit,
      paymentTerms,
      customerType,
      status,
    } = req.body;

    // Check duplicate phone if phone is being changed
    if (phone) {
      const cleanPhone = normalizePhone(phone);
      if (cleanPhone !== customer.phone) {
        const phoneExists = await Customer.findOne({
          businessId: activeBusinessId,
          phone: cleanPhone,
          _id: { $ne: customer._id },
        });
        if (phoneExists) {
          return res.status(409).json({
            success: false,
            message: `Another customer with phone number ${cleanPhone} already exists: "${phoneExists.name}".`,
          });
        }
        customer.phone = cleanPhone;
      }
    }

    if (name !== undefined) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim().toLowerCase();
    if (billingAddress !== undefined) customer.billingAddress = billingAddress.trim();
    if (deliveryAddress !== undefined) customer.deliveryAddress = deliveryAddress.trim();
    if (address !== undefined) customer.address = address.trim();
    if (notes !== undefined) customer.notes = notes.trim();
    if (creditLimit !== undefined) customer.creditLimit = Math.max(0, Number(creditLimit || 0));
    if (paymentTerms !== undefined) customer.paymentTerms = paymentTerms;
    if (customerType !== undefined) customer.customerType = customerType;
    if (status !== undefined) customer.status = status;

    await customer.save();

    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: 'CUSTOMER_UPDATED',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone },
    });

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('[Update Customer Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Archive customer safely (preserving full financial history)
// @route   DELETE /api/v1/customers/:id
export const archiveCustomer = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.status = 'Archived';
    await customer.save();

    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: 'CUSTOMER_ARCHIVED',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone },
    });

    res.json({ success: true, message: 'Customer archived safely', data: customer });
  } catch (error) {
    console.error('[Archive Customer Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Restore archived customer
// @route   PATCH /api/v1/customers/:id/restore
export const restoreCustomer = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.status = 'Active';
    await customer.save();

    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: 'CUSTOMER_RESTORED',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      details: { name: customer.name, phone: customer.phone },
    });

    res.json({ success: true, message: 'Customer restored successfully', data: customer });
  } catch (error) {
    console.error('[Restore Customer Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unified purchase history (POS Sales + Online Storefront Orders)
// @route   GET /api/v1/customers/:id/orders
export const getCustomerOrders = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { channel = 'all', paymentStatus = 'all', startDate, endDate } = req.query;

    // POS Sales query
    const saleQuery = {
      businessId: activeBusinessId,
      $or: [{ customerId: customer._id }, { customerPhone: customer.phone }],
    };

    // Online Orders query
    const orderQuery = {
      businessId: activeBusinessId,
      'customer.phone': customer.phone,
    };

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      saleQuery.createdAt = dateFilter;
      orderQuery.createdAt = dateFilter;
    }

    let sales = [];
    let orders = [];

    if (channel === 'all' || channel === 'POS' || channel === 'Offline') {
      sales = await Sale.find(saleQuery).sort({ createdAt: -1 });
    }

    if (channel === 'all' || channel === 'Online') {
      orders = await Order.find(orderQuery).sort({ createdAt: -1 });
    }

    // Unified format
    const unified = [
      ...sales.map((s) => ({
        id: s._id,
        orderNumber: s.billNumber || `#${s.sequenceNumber}`,
        date: s.createdAt,
        channel: 'POS',
        type: 'Offline',
        items: s.items || [],
        itemCount: (s.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
        subtotal: s.subtotal || 0,
        discount: s.discountAmount || 0,
        tax: s.taxAmount || 0,
        totalAmount: s.totalAmount || 0,
        paidAmount: s.paidAmount !== undefined ? s.paidAmount : s.paymentStatus === 'paid' ? s.totalAmount : 0,
        balanceDue: s.balanceDue !== undefined ? s.balanceDue : s.paymentStatus === 'paid' ? 0 : s.totalAmount,
        dueDate: s.dueDate,
        paymentStatus: s.paymentStatus || 'paid',
        paymentMethod: s.paymentMethod || 'Cash',
        orderStatus: 'Completed',
        cashierName: s.cashierName || 'Cashier',
        billFormat: s.billFormat || 'Standard',
      })),
      ...orders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber || `#${o.sequenceNumber}`,
        date: o.createdAt,
        channel: 'Online',
        type: 'Online',
        items: o.items || [],
        itemCount: (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
        subtotal: o.subtotal || 0,
        discount: o.discount || 0,
        tax: 0,
        deliveryCharges: o.deliveryCharges || 0,
        totalAmount: o.totalAmount || 0,
        paidAmount: o.paymentStatus === 'paid' ? o.totalAmount : 0,
        balanceDue: o.paymentStatus === 'paid' ? 0 : o.totalAmount,
        dueDate: null,
        paymentStatus: o.paymentStatus || 'paid',
        paymentMethod: o.paymentMethod || 'UPI',
        orderStatus: o.orderStatus || 'Pending',
        cashierName: 'Online Storefront',
      })),
    ];

    // Filter by paymentStatus if provided
    let filtered = unified;
    if (paymentStatus && paymentStatus !== 'all') {
      filtered = filtered.filter((item) => item.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: filtered });
  } catch (error) {
    console.error('[Get Customer Orders Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get outstanding bills eligible for payment allocation
// @route   GET /api/v1/customers/:id/dues
export const getCustomerDues = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Find Sales with balanceDue > 0 or paymentStatus in ['pending', 'partial', 'overdue']
    const sales = await Sale.find({
      businessId: activeBusinessId,
      $or: [{ customerId: customer._id }, { customerPhone: customer.phone }],
      $or: [
        { balanceDue: { $gt: 0 } },
        { paymentStatus: { $in: ['pending', 'partial', 'overdue'] } },
      ],
    }).sort({ createdAt: 1 });

    const now = new Date();
    const duesList = sales
      .map((s) => {
        const total = s.totalAmount || 0;
        const paid = s.paidAmount || (s.paymentStatus === 'paid' ? total : 0);
        const due = s.balanceDue !== undefined ? s.balanceDue : Math.max(0, total - paid);
        const isOverdue = s.dueDate ? new Date(s.dueDate) < now : false;

        return {
          saleId: s._id,
          billNumber: s.billNumber || `#${s.sequenceNumber}`,
          date: s.createdAt,
          dueDate: s.dueDate,
          totalAmount: total,
          paidAmount: paid,
          balanceDue: due,
          isOverdue,
          paymentStatus: s.paymentStatus,
          paymentMethod: s.paymentMethod,
        };
      })
      .filter((d) => d.balanceDue > 0);

    const totalOutstanding = duesList.reduce((sum, d) => sum + d.balanceDue, 0);

    res.json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          outstandingDue: customer.outstandingDue || 0,
          creditLimit: customer.creditLimit || 0,
        },
        duesList,
        totalOutstanding,
      },
    });
  } catch (error) {
    console.error('[Get Customer Dues Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record full or partial payment against customer dues & bills
// @route   POST /api/v1/customers/:id/payments
export const recordCustomerPayment = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const {
      amount,
      paymentMethod = 'Cash',
      paymentDate = new Date(),
      referenceNumber = '',
      notes = '',
      allocations = [],
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    // Generate unique sequential payment receipt number
    const lastPayment = await CustomerPayment.findOne({ businessId: activeBusinessId }).sort({ createdAt: -1 });
    let nextNum = 1001;
    if (lastPayment && lastPayment.paymentNumber) {
      const match = lastPayment.paymentNumber.match(/\d+/);
      if (match) nextNum = parseInt(match[0], 10) + 1;
    }
    const paymentNumber = `PAY-${nextNum}`;

    // Process and update allocated bills
    const validAllocations = [];
    let totalAllocated = 0;

    for (const alloc of allocations) {
      if (!alloc.saleId || !alloc.allocatedAmount || alloc.allocatedAmount <= 0) continue;

      const sale = await Sale.findOne({ _id: alloc.saleId, businessId: activeBusinessId });
      if (sale) {
        const allocAmount = Math.min(Number(alloc.allocatedAmount), sale.balanceDue || sale.totalAmount);
        sale.paidAmount = (sale.paidAmount || 0) + allocAmount;
        sale.balanceDue = Math.max(0, sale.totalAmount - sale.paidAmount);
        sale.paymentStatus = sale.balanceDue <= 0 ? 'paid' : 'partial';
        await sale.save();

        totalAllocated += allocAmount;
        validAllocations.push({
          saleId: sale._id,
          billNumber: sale.billNumber || `#${sale.sequenceNumber}`,
          allocatedAmount: allocAmount,
        });
      }
    }

    // Create Payment Receipt
    const payment = await CustomerPayment.create({
      businessId: activeBusinessId,
      customerId: customer._id,
      paymentNumber,
      amount: numAmount,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
      receivedBy: {
        id: req.user?._id,
        name: req.user?.name || 'Staff',
      },
      allocations: validAllocations,
    });

    // Update Customer Totals & Outstanding Due
    customer.totalPaid = (customer.totalPaid || 0) + numAmount;
    customer.outstandingDue = Math.max(0, (customer.outstandingDue || 0) - numAmount);
    await customer.save();

    // Create Customer Ledger Entry
    const ledgerEntry = await CustomerLedger.create({
      businessId: activeBusinessId,
      customerId: customer._id,
      date: new Date(paymentDate),
      reference: paymentNumber,
      transactionType: 'Payment Received',
      debit: 0,
      credit: numAmount,
      runningBalance: customer.outstandingDue,
      sourceType: 'CustomerPayment',
      sourceId: payment._id,
      notes: notes.trim() || `Payment received via ${paymentMethod}`,
      recordedBy: {
        id: req.user?._id,
        name: req.user?.name || 'Staff',
      },
    });

    // Audit Log
    await AuditLog.create({
      businessId: activeBusinessId,
      userId: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: 'PAYMENT_RECORDED',
      entityType: 'CustomerPayment',
      entityId: payment._id.toString(),
      details: {
        paymentNumber,
        customerName: customer.name,
        amount: numAmount,
        paymentMethod,
        allocationsCount: validAllocations.length,
        remainingDue: customer.outstandingDue,
      },
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded successfully.`,
      data: {
        payment,
        ledgerEntry,
        customer: {
          _id: customer._id,
          name: customer.name,
          outstandingDue: customer.outstandingDue,
          totalPaid: customer.totalPaid,
        },
      },
    });
  } catch (error) {
    console.error('[Record Customer Payment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer ledger entries with running balance & summary
// @route   GET /api/v1/customers/:id/ledger
export const getCustomerLedger = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { startDate, endDate, search } = req.query;

    const query = {
      businessId: activeBusinessId,
      customerId: customer._id,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search && search.trim()) {
      query.$or = [
        { reference: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
        { transactionType: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const entries = await CustomerLedger.find(query).sort({ date: 1, createdAt: 1 });

    const totalDebits = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredits = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const closingBalance = customer.outstandingDue || 0;

    res.json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          outstandingDue: customer.outstandingDue || 0,
        },
        entries: entries.reverse(), // Newest first for UI display
        summary: {
          totalDebits,
          totalCredits,
          closingBalance,
          entriesCount: entries.length,
        },
      },
    });
  } catch (error) {
    console.error('[Get Customer Ledger Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment receipts for a customer
// @route   GET /api/v1/customers/:id/payments
export const getCustomerPayments = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const payments = await CustomerPayment.find({
      businessId: activeBusinessId,
      customerId: customer._id,
    }).sort({ paymentDate: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('[Get Customer Payments Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate customer account statement
// @route   GET /api/v1/customers/:id/statement
export const getCustomerStatement = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const business = await Business.findById(activeBusinessId);
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Calculate opening balance before start date
    const priorEntries = await CustomerLedger.find({
      businessId: activeBusinessId,
      customerId: customer._id,
      date: { $lt: start },
    });

    const priorDebits = priorEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const priorCredits = priorEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const openingBalance = priorDebits - priorCredits;

    // Period entries
    const periodEntries = await CustomerLedger.find({
      businessId: activeBusinessId,
      customerId: customer._id,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1, createdAt: 1 });

    const totalDebits = periodEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredits = periodEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const closingBalance = openingBalance + totalDebits - totalCredits;

    res.json({
      success: true,
      data: {
        statementDate: new Date(),
        period: {
          startDate: start,
          endDate: end,
        },
        business: {
          name: business?.name || 'Store',
          phone: business?.contactPhone || '',
          email: business?.contactEmail || '',
          currency: business?.currency || 'INR',
          currencySymbol: business?.currencySymbol || '₹',
        },
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          billingAddress: customer.billingAddress || customer.address,
          creditLimit: customer.creditLimit || 0,
          paymentTerms: customer.paymentTerms || 'Due on Receipt',
        },
        openingBalance,
        totalDebits,
        totalCredits,
        closingBalance,
        entries: periodEntries,
      },
    });
  } catch (error) {
    console.error('[Get Customer Statement Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chronological customer activity timeline
// @route   GET /api/v1/customers/:id/timeline
export const getCustomerTimeline = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const customer = await Customer.findOne({ _id: req.params.id, businessId: activeBusinessId });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const events = [];

    // 1. Customer creation
    events.push({
      type: 'CUSTOMER_CREATED',
      title: 'Customer Added',
      description: `Customer account was registered with ${customer.customerType} type`,
      date: customer.createdAt,
      amount: null,
      ref: null,
    });

    // 2. POS Sales
    const sales = await Sale.find({
      businessId: activeBusinessId,
      $or: [{ customerId: customer._id }, { customerPhone: customer.phone }],
    }).limit(20);

    sales.forEach((s) => {
      const isCredit = s.paymentMethod === 'Credit' || (s.balanceDue || 0) > 0;
      events.push({
        type: isCredit ? 'CREDIT_SALE' : 'POS_SALE',
        title: isCredit ? 'Credit Sale Recorded' : 'POS Bill Generated',
        description: `Bill ${s.billNumber} with ${s.items?.length || 0} items (${s.paymentMethod})`,
        date: s.createdAt,
        amount: s.totalAmount,
        ref: s.billNumber,
      });
    });

    // 3. Online Orders
    const orders = await Order.find({
      businessId: activeBusinessId,
      'customer.phone': customer.phone,
    }).limit(20);

    orders.forEach((o) => {
      events.push({
        type: 'ONLINE_ORDER',
        title: `Online Order Placed (${o.orderStatus})`,
        description: `Order ${o.orderNumber} placed through online storefront`,
        date: o.createdAt,
        amount: o.totalAmount,
        ref: o.orderNumber,
      });
    });

    // 4. Payments
    const payments = await CustomerPayment.find({
      businessId: activeBusinessId,
      customerId: customer._id,
    }).limit(20);

    payments.forEach((p) => {
      events.push({
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        description: `Payment ${p.paymentNumber} received via ${p.paymentMethod}`,
        date: p.paymentDate,
        amount: p.amount,
        ref: p.paymentNumber,
      });
    });

    // Sort newest first
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('[Get Customer Timeline Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
