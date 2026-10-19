import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart,
  ShoppingBag,
  Coins,
  ArrowUpRight,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f472b6'];

export const ReportsPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.getFinancialReport(range);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load financial reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [range, currentBusinessId]);

  const report = data || {
    grossRevenue: 0,
    totalOfflineRevenue: 0,
    totalOnlineRevenue: 0,
    totalCogs: 0,
    grossProfit: 0,
    totalCashReceived: 0,
    salesCount: 0,
    ordersCount: 0,
  };

  const categoryData = data?.categoryData || [];
  const weeklyTrend = data?.weeklyTrend || [];

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Amount (INR)'],
      ['Gross Revenue', report.grossRevenue],
      ['Offline POS Revenue', report.totalOfflineRevenue],
      ['Online Storefront Revenue', report.totalOnlineRevenue],
      ['Cost of Goods Sold (COGS)', report.totalCogs],
      ['Gross Profit', report.grossProfit],
      ['Cash Received', report.totalCashReceived],
      ['Total In-Store Bills', report.salesCount],
      ['Total Online Orders', report.ordersCount],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mystore-financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const profitMargin = report.grossRevenue > 0
    ? Math.round((report.grossProfit / report.grossRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit your store revenue, cost of goods sold, profit margins and category breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold shadow-sm">
            {['today', '7d', '30d', 'year'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                  range === r ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Gross Sales Revenue</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{Number(report.grossRevenue || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {report.salesCount + report.ordersCount} total transactions
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Cost of Goods Sold (COGS)</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{Number(report.totalCogs || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Actual supplier cost of sold inventory</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Gross Profit</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">₹{Number(report.grossProfit || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Margin: {profitMargin}%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Cash Received</p>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">₹{Number(report.totalCashReceived || 0).toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Physical cash tendered at POS</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Revenue & Profit Trend */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6">Revenue vs Gross Profit Trend</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(val, name) => [`₹${val}`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">Category-wise Sales</h2>
            {categoryData.length > 0 ? (
              <>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`₹${val}`, 'Sales']} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 text-xs font-medium">
                  {categoryData.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="text-slate-600">{cat.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">₹{Number(cat.value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No category sales yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Categorized sales distribution will appear here once items are billed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
