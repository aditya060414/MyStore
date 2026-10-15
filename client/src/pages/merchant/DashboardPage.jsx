import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  ShoppingCart,
  Store,
  Coins,
  FileText,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  ChevronDown,
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
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
  }, []);

  const kpis = data?.kpis || {
    todaySales: 12450,
    salesGrowth: '+12%',
    itemsSold: 43,
    itemsGrowth: '+8%',
    profit: 3820,
    profitGrowth: '+18%',
    onlineOrders: 12,
    ordersGrowth: '+5%',
  };

  const chartData = data?.salesOverview || [
    { time: '6AM', online: 30, offline: 65 },
    { time: '7AM', online: 45, offline: 80 },
    { time: '8AM', online: 60, offline: 95 },
    { time: '9AM', online: 95, offline: 110 },
    { time: '10AM', online: 120, offline: 130 },
    { time: '11AM', online: 110, offline: 140 },
    { time: '12PM', online: 150, offline: 175 },
    { time: '1PM', online: 125, offline: 140 },
    { time: '2PM', online: 100, offline: 120 },
    { time: '3PM', online: 80, offline: 90 },
    { time: '4PM', online: 115, offline: 125 },
    { time: '5PM', online: 140, offline: 155 },
    { time: '6PM', online: 160, offline: 170 },
    { time: '7PM', online: 135, offline: 145 },
    { time: '8PM', online: 90, offline: 110 },
    { time: '9PM', online: 70, offline: 85 },
  ];

  const topItems = data?.topSellingItems || [
    { rank: 1, item: 'Maggi Noodles', sold: 24, revenue: 288 },
    { rank: 2, item: 'Coca Cola', sold: 18, revenue: 720 },
    { rank: 3, item: 'Lays Classic', sold: 16, revenue: 320 },
    { rank: 4, item: 'Amul Milk', sold: 14, revenue: 392 },
    { rank: 5, item: 'Parle-G', sold: 12, revenue: 120 },
  ];

  const lowStock = data?.lowStockItems || [
    {
      rank: 1,
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=100&q=80',
      itemName: 'Maggi Noodles',
      brand: 'Nestle',
      stock: 3,
    },
    {
      rank: 2,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=100&q=80',
      itemName: 'Coca Cola',
      brand: 'Coca Cola',
      stock: 5,
    },
    {
      rank: 3,
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=100&q=80',
      itemName: 'Lays Classic',
      brand: 'Lays',
      stock: 4,
    },
  ];

  const recentOrders = data?.recentOrders || [
    { id: '#1001', customer: 'Walk-in', type: 'Offline', amount: 320, status: 'Completed' },
    { id: '#1002', customer: 'Online Customer', type: 'Online', amount: 450, status: 'Processing' },
    { id: '#1003', customer: 'Walk-in', type: 'Offline', amount: 210, status: 'Completed' },
    { id: '#1004', customer: 'Rahul Mehta', type: 'Online', amount: 620, status: 'Pending' },
    { id: '#1005', customer: 'Sneha Kapoor', type: 'Online', amount: 280, status: 'Delivered' },
  ];

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

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

      {/* KPI Cards Row (Matching screenshot exact layout and colors) */}
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
                ₹ {kpis.todaySales.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            {kpis.salesGrowth}
          </span>
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
                {kpis.itemsSold}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            {kpis.itemsGrowth}
          </span>
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
                ₹ {kpis.profit.toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            {kpis.profitGrowth}
          </span>
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
                {kpis.onlineOrders}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs yesterday</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            {kpis.ordersGrowth}
          </span>
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
              <div className="flex items-center gap-1 text-xs font-medium bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 cursor-pointer">
                <span>Today</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={3} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 200]} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
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
                      <img src={item.image} alt={item.itemName} className="w-8 h-8 rounded-lg object-cover border border-slate-100" />
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
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <Link to="/app/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

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
                            : 'bg-pink-50 text-pink-600'
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
                            : ord.status === 'Processing'
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
        </div>
      </div>
    </div>
  );
};
