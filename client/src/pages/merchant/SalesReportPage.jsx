import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Store,
  Globe,
  Receipt,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  Package,
  CircleDollarSign,
  Layers,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const SalesReportPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;

  // Selected date in YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [channelFilter, setChannelFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedTxId, setExpandedTxId] = useState(null);

  const fetchSalesReport = async (dateParam = selectedDate, channelParam = channelFilter, paymentParam = paymentFilter) => {
    setLoading(true);
    try {
      const res = await api.getSalesReport({
        date: dateParam,
        channel: channelParam,
        paymentMethod: paymentParam,
      });
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport(selectedDate, channelFilter, paymentFilter);
  }, [selectedDate, channelFilter, paymentFilter, currentBusinessId]);

  const handleDateChange = (newDateStr) => {
    setSelectedDate(newDateStr);
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() - 1);
    const newY = prev.getFullYear();
    const newM = String(prev.getMonth() + 1).padStart(2, '0');
    const newD = String(prev.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 1);
    const newY = next.getFullYear();
    const newM = String(next.getMonth() + 1).padStart(2, '0');
    const newD = String(next.getDate()).padStart(2, '0');
    const nextDateStr = `${newY}-${newM}-${newD}`;

    // Don't allow navigating into future days
    if (nextDateStr <= getTodayStr()) {
      setSelectedDate(nextDateStr);
    }
  };

  const isCurrentToday = selectedDate === getTodayStr();

  const handleExportCSV = () => {
    if (!reportData) return;
    const { kpis, dateInfo, transactions } = reportData;
    
    let csvContent = `data:text/csv;charset=utf-8,`;
    csvContent += `Sales Report - ${dateInfo.formattedDisplayDate}\n\n`;
    csvContent += `METRIC,VALUE\n`;
    csvContent += `Total Sales (INR),₹${kpis.totalSales.toLocaleString('en-IN')}\n`;
    csvContent += `Total Items Sold,${kpis.totalItemsSold}\n`;
    csvContent += `Gross Profit (INR),₹${kpis.totalProfit.toLocaleString('en-IN')}\n`;
    csvContent += `Total Bills / Transactions,${kpis.totalTransactions}\n`;
    csvContent += `In-Store Offline Sales,₹${kpis.offlineSales.toLocaleString('en-IN')} (${kpis.offlineBillsCount} bills)\n`;
    csvContent += `Online Storefront Sales,₹${kpis.onlineSales.toLocaleString('en-IN')} (${kpis.onlineOrdersCount} orders)\n`;
    csvContent += `Average Bill Value,₹${kpis.avgTransactionValue.toLocaleString('en-IN')}\n\n`;

    csvContent += `TRANSACTIONS LIST\n`;
    csvContent += `Time,Transaction ID,Channel,Customer,Phone,Payment,Status,Items Count,Total Amount (INR)\n`;

    (transactions || []).forEach((t) => {
      const timeStr = new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      csvContent += `"${timeStr}","${t.transactionNumber}","${t.channel}","${t.customerName}","${t.customerPhone}","${t.paymentMethod}","${t.orderStatus || t.paymentStatus}","${t.itemsCount}","${t.totalAmount}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const kpis = reportData?.kpis || {
    totalSales: 0,
    totalProfit: 0,
    totalItemsSold: 0,
    totalTransactions: 0,
    offlineSales: 0,
    offlineBillsCount: 0,
    offlineItemsSold: 0,
    onlineSales: 0,
    onlineOrdersCount: 0,
    onlineItemsSold: 0,
    avgTransactionValue: 0,
  };

  const dateInfo = reportData?.dateInfo || {
    selectedDate,
    dayName: 'Today',
    formattedDisplayDate: 'Today',
    isToday: isCurrentToday,
    isYesterday: false,
  };

  const paymentBreakdown = reportData?.paymentBreakdown || [];
  const hourlyData = reportData?.hourlyData || [];
  const transactions = reportData?.transactions || [];

  const toggleExpand = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Date Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Daily Sales Report
                  {dateInfo.isToday && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Today
                    </span>
                  )}
                  {dateInfo.isYesterday && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      Yesterday
                    </span>
                  )}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-0.5">
                  Showing sales breakdown for{' '}
                  <span className="font-semibold text-slate-700">{dateInfo.formattedDisplayDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Date Switcher Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Prev Day Button */}
            <button
              onClick={handlePrevDay}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Day</span>
            </button>

            {/* Jump to Today Button */}
            <button
              onClick={() => handleDateChange(getTodayStr())}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isCurrentToday
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Today
            </button>

            {/* Jump to Yesterday Button */}
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(
                  y.getDate()
                ).padStart(2, '0')}`;
                handleDateChange(yStr);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                dateInfo.isYesterday
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Yesterday
            </button>

            {/* Next Day Button */}
            <button
              onClick={handleNextDay}
              disabled={isCurrentToday}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isCurrentToday
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
              title="Next Day"
            >
              <span>Next Day</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Native Date Picker */}
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="date"
                max={getTodayStr()}
                value={selectedDate}
                onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs"
              />
            </div>

            {/* Export & Print */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                onClick={handleExportCSV}
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                title="Export Day Report to CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                title="Print Sales Report"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dateInfo.isToday ? "Today's Total Sales" : 'Total Sales'}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{(kpis.totalSales || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
              <span>{kpis.totalTransactions || 0} transactions</span>
              <span>•</span>
              <span>Avg ₹{(kpis.avgTransactionValue || 0).toLocaleString('en-IN')} / bill</span>
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-blue-500/5 pointer-events-none" />
        </div>

        {/* Total Items Sold */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Sold</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {kpis.totalItemsSold || 0}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
              <span>{kpis.offlineItemsSold || 0} In-store</span>
              <span>•</span>
              <span>{kpis.onlineItemsSold || 0} Online</span>
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-indigo-500/5 pointer-events-none" />
        </div>

        {/* Gross Profit */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ₹{(kpis.totalProfit || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-emerald-600">
              <span className="font-semibold">
                {kpis.totalSales > 0 ? `${Math.round((kpis.totalProfit / kpis.totalSales) * 100)}% Margin` : '0% Margin'}
              </span>
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-emerald-500/5 pointer-events-none" />
        </div>

        {/* In-Store vs Online Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channel Split</span>
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-500" /> In-Store:
              </span>
              <span className="font-bold text-slate-900">
                ₹{(kpis.offlineSales || 0).toLocaleString('en-IN')} ({kpis.offlineBillsCount || 0})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" /> Online:
              </span>
              <span className="font-bold text-slate-900">
                ₹{(kpis.onlineSales || 0).toLocaleString('en-IN')} ({kpis.onlineOrdersCount || 0})
              </span>
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-16 h-16 rounded-full bg-violet-500/5 pointer-events-none" />
        </div>
      </div>

      {/* Middle Section: Hourly Sales Curve & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Progression */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Hourly Sales Progression
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Track peak selling hours throughout {dateInfo.dayName}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                  labelFormatter={(lbl) => `Time: ${lbl}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              Payment Methods
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Settlements received on {dateInfo.formattedDisplayDate}
            </p>

            <div className="mt-5 space-y-3">
              {paymentBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No transactions recorded for this day</div>
              ) : (
                paymentBreakdown.map((pm) => {
                  const percent =
                    kpis.totalSales > 0 ? Math.round((pm.amount / kpis.totalSales) * 100) : 0;
                  return (
                    <div key={pm.method} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          {pm.method === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-500" />}
                          {pm.method === 'UPI' && <Smartphone className="w-3.5 h-3.5 text-blue-500" />}
                          {pm.method === 'Card' && <CreditCard className="w-3.5 h-3.5 text-purple-500" />}
                          {pm.method !== 'Cash' && pm.method !== 'UPI' && pm.method !== 'Card' && (
                            <CircleDollarSign className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          {pm.method}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            ₹{pm.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-slate-400">({pm.count} bills)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Total Receipts</span>
            <span>₹{(kpis.totalSales || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Detailed Transactions & Itemized Bills Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              Transactions on {dateInfo.formattedDisplayDate}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Itemized list of in-store POS bills and online customer orders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel Filter Pill */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  channelFilter === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setChannelFilter('Offline')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  channelFilter === 'Offline' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In-Store
              </button>
              <button
                onClick={() => setChannelFilter('Online')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  channelFilter === 'Online' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Online
              </button>
            </div>

            {/* Payment Filter Pill */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Receipt / Bill #</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                      <span>Loading daily sales report...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales recorded for {dateInfo.formattedDisplayDate}.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  const timeFormatted = new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {tx.transactionNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                          {timeFormatted}
                        </td>
                        <td className="py-3 px-4">
                          {tx.channel === 'Online' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Globe className="w-3 h-3" /> Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Store className="w-3 h-3" /> In-Store
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{tx.customerName}</div>
                          {tx.customerPhone && (
                            <div className="text-[11px] text-slate-400">{tx.customerPhone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {tx.itemsCount} {tx.itemsCount === 1 ? 'item' : 'items'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                          ₹{Number(tx.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View sold items"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Itemized Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Sold Items Breakdown ({tx.items?.length || 0})
                              </div>
                              <div className="divide-y divide-slate-100">
                                {(tx.items || []).map((it, idx) => (
                                  <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                    <div className="font-medium text-slate-800">
                                      {it.name}{' '}
                                      <span className="text-slate-400">× {it.quantity}</span>
                                    </div>
                                    <div className="font-semibold text-slate-900">
                                      ₹{Number(it.total || it.price * it.quantity).toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReportPage;
