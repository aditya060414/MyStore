import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Get dashboard metrics and graphs matching store activity
// @route   GET /api/v1/reports/dashboard
export const getDashboardMetrics = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;

    // Time boundaries for Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Time boundaries for Yesterday
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    // Sales and orders today
    const salesToday = await Sale.find({
      businessId: activeBusinessId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const ordersToday = await Order.find({
      businessId: activeBusinessId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
      orderStatus: { $ne: 'Cancelled' },
    });

    // Sales and orders yesterday for growth comparison
    const salesYesterday = await Sale.find({
      businessId: activeBusinessId,
      createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd },
    });

    const ordersYesterday = await Order.find({
      businessId: activeBusinessId,
      createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd },
      orderStatus: { $ne: 'Cancelled' },
    });

    // Offline sales metrics today
    const offlineSalesToday = salesToday.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const offlineProfitToday = salesToday.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
    const offlineItemsCount = salesToday.reduce(
      (sum, s) => sum + (s.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0),
      0
    );

    // Online sales metrics today
    const onlineSalesToday = ordersToday.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const onlineItemsCount = ordersToday.reduce(
      (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0),
      0
    );

    const totalSalesAmount = offlineSalesToday + onlineSalesToday;
    const totalItemsSold = offlineItemsCount + onlineItemsCount;
    const totalProfit = offlineProfitToday;
    const onlineOrdersCount = ordersToday.length;

    // Growth comparison calculation
    const yesterdaySalesTotal =
      salesYesterday.reduce((sum, s) => sum + (s.totalAmount || 0), 0) +
      ordersYesterday.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const yesterdayItemsSold =
      salesYesterday.reduce((sum, s) => sum + (s.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0), 0) +
      ordersYesterday.reduce((sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.quantity || 0), 0), 0);

    const yesterdayProfit = salesYesterday.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
    const yesterdayOrdersCount = ordersYesterday.length;

    const formatGrowth = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? '+100%' : '0%';
      }
      const diff = ((current - previous) / previous) * 100;
      const rounded = Math.round(diff);
      return `${rounded >= 0 ? '+' : ''}${rounded}%`;
    };

    const salesGrowth = formatGrowth(totalSalesAmount, yesterdaySalesTotal);
    const itemsGrowth = formatGrowth(totalItemsSold, yesterdayItemsSold);
    const profitGrowth = formatGrowth(totalProfit, yesterdayProfit);
    const ordersGrowth = formatGrowth(onlineOrdersCount, yesterdayOrdersCount);

    // Hourly bar chart data (6AM to 9PM) comparing real Online vs Offline
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const hourlyData = hours.map((hour) => {
      const label = hour === 12 ? '12PM' : hour > 12 ? `${hour - 12}PM` : `${hour}AM`;

      const offlineInHour = salesToday
        .filter((s) => new Date(s.createdAt).getHours() === hour)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      const onlineInHour = ordersToday
        .filter((o) => new Date(o.createdAt).getHours() === hour)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        time: label,
        online: onlineInHour,
        offline: offlineInHour,
      };
    });

    // Top Selling Items calculated dynamically from all completed sales & orders
    const allSales = await Sale.find({ businessId: activeBusinessId });
    const allOrders = await Order.find({
      businessId: activeBusinessId,
      orderStatus: { $ne: 'Cancelled' },
    });

    const itemMap = {};

    allSales.forEach((s) => {
      (s.items || []).forEach((it) => {
        const key = it.productId?.toString() || it.name;
        if (!itemMap[key]) {
          itemMap[key] = {
            item: it.name,
            brand: it.brand || '',
            sold: 0,
            revenue: 0,
          };
        }
        itemMap[key].sold += it.quantity || 0;
        itemMap[key].revenue += it.total || ((it.price || 0) * (it.quantity || 0));
      });
    });

    allOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.productId?.toString() || it.name;
        if (!itemMap[key]) {
          itemMap[key] = {
            item: it.name,
            brand: '',
            sold: 0,
            revenue: 0,
          };
        }
        itemMap[key].sold += it.quantity || 0;
        itemMap[key].revenue += it.total || ((it.price || 0) * (it.quantity || 0));
      });
    });

    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.sold - a.sold || b.revenue - a.revenue)
      .slice(0, 5)
      .map((it, idx) => ({
        rank: idx + 1,
        ...it,
      }));

    // Low stock items directly from DB (no static mock fallbacks)
    const lowStockItemsDb = await Product.find({
      businessId: activeBusinessId,
      isArchived: false,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .sort({ stock: 1 })
      .limit(5);

    const lowStockItems = lowStockItemsDb.map((p, idx) => ({
      rank: idx + 1,
      image: p.image || '',
      itemName: p.name,
      brand: p.brand || 'General',
      stock: p.stock,
    }));

    // Recent orders and bills (real data merged & sorted)
    const recentBills = await Sale.find({ businessId: activeBusinessId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentOnline = await Order.find({ businessId: activeBusinessId })
      .sort({ createdAt: -1 })
      .limit(5);

    const combinedOrders = [
      ...recentBills.map((s) => ({
        id: s.billNumber || `#${s.sequenceNumber}`,
        customer: s.customerName || 'Walk-in',
        type: 'Offline',
        amount: s.totalAmount,
        status: s.paymentStatus === 'paid' ? 'Completed' : s.paymentStatus,
        createdAt: s.createdAt,
      })),
      ...recentOnline.map((o) => ({
        id: o.orderNumber || `#${o.sequenceNumber}`,
        customer: o.customer?.name || 'Customer',
        type: 'Online',
        amount: o.totalAmount,
        status: o.orderStatus,
        createdAt: o.createdAt,
      })),
    ];

    combinedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentOrders = combinedOrders.slice(0, 5);

    res.json({
      success: true,
      data: {
        kpis: {
          todaySales: totalSalesAmount,
          salesGrowth,
          itemsSold: totalItemsSold,
          itemsGrowth,
          profit: totalProfit,
          profitGrowth,
          onlineOrders: onlineOrdersCount,
          ordersGrowth,
        },
        salesOverview: hourlyData,
        topSellingItems,
        lowStockItems,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('[Dashboard Metrics Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed financial report (Revenue, COGS, Gross Profit, Breakdown)
// @route   GET /api/v1/reports/financial
export const getFinancialReport = async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const activeBusinessId = req.businessId || req.tenantId;

    let startDate = new Date();
    if (range === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (range === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (range === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const sales = await Sale.find({
      businessId: activeBusinessId,
      createdAt: { $gte: startDate },
    });

    const orders = await Order.find({
      businessId: activeBusinessId,
      createdAt: { $gte: startDate },
      orderStatus: { $ne: 'Cancelled' },
    });

    const totalOfflineRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalOnlineRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const grossRevenue = totalOfflineRevenue + totalOnlineRevenue;
    const totalCogs = sales.reduce((acc, s) => acc + (s.cogs || 0), 0);
    const grossProfit = grossRevenue - totalCogs;
    const totalCashReceived = sales
      .filter((s) => s.paymentMethod === 'Cash')
      .reduce((acc, s) => acc + (s.totalAmount || 0), 0);

    // Dynamic category breakdown from real sales
    const categoryTotals = {};
    sales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const cat = item.category || 'General';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.total || ((item.price || 0) * (item.quantity || 1)));
      });
    });

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));

    // Weekly/daily trend dynamically calculated
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = dayNames[d.getDay()];
      trendMap[dayKey] = {
        day: dayKey,
        revenue: 0,
        profit: 0,
      };
    }

    sales.forEach((s) => {
      const dayKey = dayNames[new Date(s.createdAt).getDay()];
      if (trendMap[dayKey]) {
        trendMap[dayKey].revenue += s.totalAmount || 0;
        trendMap[dayKey].profit += s.grossProfit || 0;
      }
    });

    orders.forEach((o) => {
      const dayKey = dayNames[new Date(o.createdAt).getDay()];
      if (trendMap[dayKey]) {
        trendMap[dayKey].revenue += o.totalAmount || 0;
      }
    });

    const weeklyTrend = Object.values(trendMap);

    res.json({
      success: true,
      data: {
        grossRevenue,
        totalOfflineRevenue,
        totalOnlineRevenue,
        totalCogs,
        grossProfit,
        totalCashReceived,
        salesCount: sales.length,
        ordersCount: orders.length,
        categoryData,
        weeklyTrend,
      },
    });
  } catch (error) {
    console.error('[Financial Report Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed Daily Sales Report with past date/day selection
// @route   GET /api/v1/reports/sales-report
export const getSalesReport = async (req, res) => {
  try {
    const activeBusinessId = req.businessId || req.tenantId;
    const { date, channel = 'all', paymentMethod = 'all' } = req.query;

    const formatDateKey = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Determine target day boundaries
    const today = new Date();
    let targetDate = new Date();

    if (date === 'yesterday') {
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (date && date !== 'today') {
      const parts = date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        targetDate = new Date(y, m, d);
      }
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const targetDateStr = formatDateKey(startOfDay);
    const todayStr = formatDateKey(today);
    
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = formatDateKey(yesterdayDate);

    const isToday = targetDateStr === todayStr;
    const isYesterday = targetDateStr === yesterdayStr;

    // Filters for Sales (In-store POS bills)
    const saleQuery = {
      businessId: activeBusinessId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    };

    if (paymentMethod !== 'all') {
      saleQuery.paymentMethod = paymentMethod;
    }

    // Filters for Orders (Online storefront)
    const orderQuery = {
      businessId: activeBusinessId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      orderStatus: { $ne: 'Cancelled' },
    };

    if (paymentMethod !== 'all') {
      orderQuery.paymentMethod = paymentMethod;
    }

    // Execute queries based on channel filter
    let sales = [];
    let orders = [];

    if (channel === 'all' || channel === 'Offline') {
      sales = await Sale.find(saleQuery).sort({ createdAt: -1 });
    }

    if (channel === 'all' || channel === 'Online') {
      orders = await Order.find(orderQuery).sort({ createdAt: -1 });
    }

    // Aggregate metrics for target day
    const offlineSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const offlineProfit = sales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
    const offlineItemsSold = sales.reduce(
      (sum, s) => sum + (s.items || []).reduce((iSum, it) => iSum + (it.quantity || 0), 0),
      0
    );
    const offlineBillsCount = sales.length;

    const onlineSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const onlineItemsSold = orders.reduce(
      (sum, o) => sum + (o.items || []).reduce((iSum, it) => iSum + (it.quantity || 0), 0),
      0
    );
    const onlineOrdersCount = orders.length;

    const totalSales = offlineSales + onlineSales;
    const totalProfit = offlineProfit; // Direct tracked profit
    const totalItemsSold = offlineItemsSold + onlineItemsSold;
    const totalTransactions = offlineBillsCount + onlineOrdersCount;
    const avgTransactionValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

    // Payment Breakdown
    const paymentMethodsMap = {
      Cash: { count: 0, amount: 0 },
      UPI: { count: 0, amount: 0 },
      Card: { count: 0, amount: 0 },
      Other: { count: 0, amount: 0 },
    };

    sales.forEach((s) => {
      const pm = s.paymentMethod || 'Cash';
      if (!paymentMethodsMap[pm]) {
        paymentMethodsMap[pm] = { count: 0, amount: 0 };
      }
      paymentMethodsMap[pm].count += 1;
      paymentMethodsMap[pm].amount += s.totalAmount || 0;
    });

    orders.forEach((o) => {
      const pm = o.paymentMethod || 'UPI';
      if (!paymentMethodsMap[pm]) {
        paymentMethodsMap[pm] = { count: 0, amount: 0 };
      }
      paymentMethodsMap[pm].count += 1;
      paymentMethodsMap[pm].amount += o.totalAmount || 0;
    });

    const paymentBreakdown = Object.entries(paymentMethodsMap)
      .map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
      }))
      .filter((p) => p.count > 0 || ['Cash', 'UPI', 'Card'].includes(p.method));

    // Hourly Distribution (6 AM - 10 PM)
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const hourlyData = hours.map((hour) => {
      const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;

      const offlineAmount = sales
        .filter((s) => new Date(s.createdAt).getHours() === hour)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

      const onlineAmount = orders
        .filter((o) => new Date(o.createdAt).getHours() === hour)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const count =
        sales.filter((s) => new Date(s.createdAt).getHours() === hour).length +
        orders.filter((o) => new Date(o.createdAt).getHours() === hour).length;

      return {
        time: label,
        hour,
        offline: offlineAmount,
        online: onlineAmount,
        total: offlineAmount + onlineAmount,
        transactions: count,
      };
    });

    // Itemized Transactions List for that day
    const combinedTransactions = [
      ...sales.map((s) => ({
        id: s._id,
        transactionNumber: s.billNumber || `#${s.sequenceNumber}`,
        type: 'Offline',
        channel: 'Offline',
        customerName: s.customerName || 'Walk-in Customer',
        customerPhone: s.customerPhone || '',
        paymentMethod: s.paymentMethod || 'Cash',
        paymentStatus: s.paymentStatus || 'paid',
        orderStatus: 'Completed',
        totalAmount: s.totalAmount || 0,
        grossProfit: s.grossProfit || 0,
        itemsCount: (s.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0),
        items: (s.items || []).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
        })),
        createdAt: s.createdAt,
      })),
      ...orders.map((o) => ({
        id: o._id,
        transactionNumber: o.orderNumber || `#${o.sequenceNumber}`,
        type: 'Online',
        channel: 'Online',
        customerName: o.customer?.name || 'Storefront Customer',
        customerPhone: o.customer?.phone || '',
        paymentMethod: o.paymentMethod || 'UPI',
        paymentStatus: o.paymentStatus || 'paid',
        orderStatus: o.orderStatus || 'Pending',
        totalAmount: o.totalAmount || 0,
        grossProfit: 0,
        itemsCount: (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0),
        items: (o.items || []).map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          total: it.total,
        })),
        createdAt: o.createdAt,
      })),
    ];

    combinedTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Past 14 Days Summary for date/day quick selector
    const pastDaysList = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStart = new Date(d);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const dateStr = formatDateKey(d);

      pastDaysList.push({
        date: dateStr,
        dStart,
        dEnd,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
        isToday: dateStr === todayStr,
        isYesterday: dateStr === yesterdayStr,
        isSelected: dateStr === targetDateStr,
        totalSales: 0,
        totalBills: 0,
      });
    }

    const windowStart = pastDaysList[pastDaysList.length - 1].dStart;
    const windowEnd = pastDaysList[0].dEnd;

    const windowSales = await Sale.find(
      {
        businessId: activeBusinessId,
        createdAt: { $gte: windowStart, $lte: windowEnd },
      },
      'totalAmount createdAt'
    );

    const windowOrders = await Order.find(
      {
        businessId: activeBusinessId,
        createdAt: { $gte: windowStart, $lte: windowEnd },
        orderStatus: { $ne: 'Cancelled' },
      },
      'totalAmount createdAt'
    );

    // Map totals to the 14 days
    windowSales.forEach((s) => {
      const sDateStr = formatDateKey(new Date(s.createdAt));
      const match = pastDaysList.find((p) => p.date === sDateStr);
      if (match) {
        match.totalSales += s.totalAmount || 0;
        match.totalBills += 1;
      }
    });

    windowOrders.forEach((o) => {
      const oDateStr = formatDateKey(new Date(o.createdAt));
      const match = pastDaysList.find((p) => p.date === oDateStr);
      if (match) {
        match.totalSales += o.totalAmount || 0;
        match.totalBills += 1;
      }
    });

    const recentDays = pastDaysList.map(({ dStart, dEnd, ...rest }) => rest);

    res.json({
      success: true,
      data: {
        dateInfo: {
          selectedDate: targetDateStr,
          dayName: targetDate.toLocaleDateString('en-US', { weekday: 'long' }),
          formattedDisplayDate: targetDate.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          isToday,
          isYesterday,
        },
        kpis: {
          totalSales,
          totalProfit,
          totalItemsSold,
          totalTransactions,
          offlineSales,
          offlineBillsCount,
          offlineItemsSold,
          onlineSales,
          onlineOrdersCount,
          onlineItemsSold,
          avgTransactionValue,
        },
        paymentBreakdown,
        hourlyData,
        transactions: combinedTransactions,
        recentDays,
      },
    });
  } catch (error) {
    console.error('[Sales Report Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

