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
