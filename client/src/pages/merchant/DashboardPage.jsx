import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Store,
  Coins,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ChevronDown,
  ShoppingBag,
  CheckCircle2,
  PackageX,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await api.getDashboardMetrics();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [currentBusinessId]);

  const kpis = data?.kpis || {
    todaySales: 0,
    salesGrowth: '0%',
    itemsSold: 0,
    itemsGrowth: '0%',
    profit: 0,
    profitGrowth: '0%',
    onlineOrders: 0,
    ordersGrowth: '0%',
  };

  const chartData = data?.salesOverview || [
    { time: '6AM', online: 0, offline: 0 },
    { time: '7AM', online: 0, offline: 0 },
    { time: '8AM', online: 0, offline: 0 },
    { time: '9AM', online: 0, offline: 0 },
    { time: '10AM', online: 0, offline: 0 },
    { time: '11AM', online: 0, offline: 0 },
    { time: '12PM', online: 0, offline: 0 },
    { time: '1PM', online: 0, offline: 0 },
    { time: '2PM', online: 0, offline: 0 },
    { time: '3PM', online: 0, offline: 0 },
    { time: '4PM', online: 0, offline: 0 },
    { time: '5PM', online: 0, offline: 0 },
    { time: '6PM', online: 0, offline: 0 },
    { time: '7PM', online: 0, offline: 0 },
    { time: '8PM', online: 0, offline: 0 },
    { time: '9PM', online: 0, offline: 0 },
  ];

  const topItems = data?.topSellingItems || [];
  const lowStock = data?.lowStockItems || [];
  const recentOrders = data?.recentOrders || [];

  // Dynamic chart Y scale
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(Number(d.online) || 0, Number(d.offline) || 0)),
    50
  );
  const chartYMax = Math.ceil(maxVal * 1.2);

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const renderGrowthBadge = (growthStr) => {
    const isNegative = growthStr && growthStr.startsWith('-');
    const isZero = !growthStr || growthStr === '0%' || growthStr === '+0%';

    if (isZero) {
      return (
        <span className="inline-flex items-center text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
          0%
        </span>
      );
    }

    if (isNegative) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
          <ArrowDownRight className="w-3 h-3" />
          {growthStr}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
        <ArrowUpRight className="w-3 h-3" />
        {growthStr}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-80 bg-slate-200 rounded-2xl"></div>
          <div className="lg:col-span-5 h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 shadow-sm self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{currentDateStr}</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Today's Sales</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                ₹ {Number(kpis.todaySales || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          {renderGrowthBadge(kpis.salesGrowth)}
        </div>

        {/* Items Sold */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Items Sold</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {kpis.itemsSold || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          {renderGrowthBadge(kpis.itemsGrowth)}
        </div>

        {/* Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Profit</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                ₹ {Number(kpis.profit || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          {renderGrowthBadge(kpis.profitGrowth)}
        </div>

        {/* Online Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Online Orders</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {kpis.onlineOrders || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          {renderGrowthBadge(kpis.ordersGrowth)}
        </div>
      </div>

      {/* Middle Grid: Sales Overview Chart + Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Overview Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sales Overview</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]"></span>
                  Online
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#93c5fd]"></span>
                  Offline
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
                <span>Today</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={3} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={[0, chartYMax]}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value, name) => [`₹${value}`, name === 'online' ? 'Online Orders' : 'POS Sales']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="online" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="offline" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Top Selling Items</h2>
              <Link to="/app/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {topItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="py-2.5 font-medium">#</th>
                      <th className="py-2.5 font-medium">Item</th>
                      <th className="py-2.5 font-medium text-center">Sold</th>
                      <th className="py-2.5 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {topItems.map((item) => (
                      <tr key={item.rank} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 text-slate-400">{item.rank}</td>
                        <td className="py-3 font-semibold text-slate-800">{item.item}</td>
                        <td className="py-3 text-center">{item.sold}</td>
                        <td className="py-3 text-right font-semibold text-slate-900">₹{item.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-14 text-center">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No items sold yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Top performing items will automatically appear here once sales are recorded.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Items + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Items */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Low Stock Items</h2>
            <Link to="/app/inventory" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {lowStock.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2.5 font-medium">#</th>
                    <th className="py-2.5 font-medium">Image</th>
                    <th className="py-2.5 font-medium">Item Name</th>
                    <th className="py-2.5 font-medium">Brand</th>
                    <th className="py-2.5 font-medium text-center">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {lowStock.map((item) => (
                    <tr key={item.rank} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 text-slate-400">{item.rank}</td>
                      <td className="py-2.5">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.itemName}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                            {item.itemName?.slice(0, 2)?.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-800">{item.itemName}</td>
                      <td className="py-2.5 text-slate-500">{item.brand}</td>
                      <td className="py-2.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          {item.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">All stock levels healthy</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                No products are currently under their low-stock replenishment alert.
              </p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <Link to="/app/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="py-2.5 font-medium">#</th>
                    <th className="py-2.5 font-medium">Customer</th>
                    <th className="py-2.5 font-medium text-center">Type</th>
                    <th className="py-2.5 font-medium text-right">Amount</th>
                    <th className="py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-600">{ord.id}</td>
                      <td className="py-3 font-semibold text-slate-800">{ord.customer}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                            ord.type === 'Online'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {ord.type}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">₹{ord.amount}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            ord.status === 'Completed' || ord.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-600'
                              : ord.status === 'Processing' || ord.status === 'Shipped'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-14 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No transactions recorded</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                In-store POS bills and online customer orders will show up here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
