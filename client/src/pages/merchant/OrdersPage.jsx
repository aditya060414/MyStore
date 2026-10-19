import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  Search,
  Filter,
  Plus,
  Eye,
  MoreVertical,
  Printer,
  Share2,
  X,
  CreditCard,
  Banknote,
  QrCode,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OrdersPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    deliveredCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [paymentFilter, setPaymentFilter] = useState('All Payment Methods');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders({
        search,
        status: statusFilter,
        paymentMethod: paymentFilter,
      });

      if (res.success) {
        setOrders(res.data.orders);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.orders.length > 0 && !selectedOrder) {
          setSelectedOrder(res.data.orders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load online orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, paymentFilter, currentBusinessId]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.updateOrderStatus(orderId, { status: newStatus });
      if (res.success) {
        setSelectedOrder(res.data);
        fetchOrders();
        toast.success(`Order marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error(`Error updating status: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-[#dcfce7] text-[#15803d] border border-emerald-200';
      case 'Shipped':
        return 'bg-[#dbeafe] text-[#1d4ed8] border border-blue-200';
      case 'Processing':
        return 'bg-[#f3e8ff] text-[#7e22ce] border border-purple-200';
      case 'Pending':
        return 'bg-[#fef3c7] text-[#b45309] border border-amber-200';
      case 'Cancelled':
        return 'bg-[#fee2e2] text-[#b91c1c] border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case 'UPI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700">
            <QrCode className="w-3 h-3" /> UPI
          </span>
        );
      case 'Card':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
            <CreditCard className="w-3 h-3" /> Card
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            <Banknote className="w-3 h-3" /> Cash
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Online Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage all customer orders from your store.</p>
        </div>
        <button
          onClick={() => toast.info('New orders are submitted automatically through your public storefront!')}
          className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* 4 Stat Cards Row (Matching screenshot exact styles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Orders</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.totalOrders}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs last month</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            +12%
          </span>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.deliveredCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs last month</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            +15%
          </span>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.pendingCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs last month</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            +2%
          </span>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Delivered</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.deliveredCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">vs last month</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            +14%
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer, or item..."
            className="w-full bg-[#f8fafc] text-xs text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option>All Status</option>
            <option>Delivered</option>
            <option>Shipped</option>
            <option>Pending</option>
            <option>Processing</option>
            <option>Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs font-medium bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
          >
            <option>All Payment Methods</option>
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-blue-600 text-white shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </div>
        </div>
      </div>

      {/* Main Split: Orders Table on Left, Order Details Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Orders List ({orders.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3 font-semibold">#</th>
                  <th className="py-3 px-3 font-semibold">Order ID</th>
                  <th className="py-3 px-3 font-semibold">Customer</th>
                  <th className="py-3 px-3 font-semibold text-right">Total Amount</th>
                  <th className="py-3 px-3 font-semibold text-center">Payment</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-3 font-semibold">Order Date</th>
                  <th className="py-3 px-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((ord, idx) => (
                  <tr
                    key={ord._id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                      selectedOrder?._id === ord._id ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{ord.customer?.name}</p>
                      <p className="text-[10px] text-slate-400">{ord.items?.length || 1} items</p>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      ₹{ord.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">{getPaymentBadge(ord.paymentMethod)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadge(ord.orderStatus)}`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="p-1 rounded-lg text-blue-600 hover:bg-blue-100"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="py-3 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing 1 to {orders.length} of {stats.totalOrders} orders</span>
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">1</span>
            </div>
          </div>
        </div>

        {/* Right Side: Order Details Card matching screenshot */}
        {selectedOrder && (
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Order Details</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(selectedOrder.orderStatus)}`}>
                {selectedOrder.orderStatus}
              </span>
            </div>

            {/* Order ID & Date */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Order ID</p>
                <p className="text-sm font-extrabold text-slate-900">{selectedOrder.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 font-medium">Order Date</p>
                <p className="text-xs font-bold text-slate-700">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="text-xs flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Payment Method:</span>
              <span className="font-bold text-slate-800">{selectedOrder.paymentMethod}</span>
            </div>

            {/* Customer Details */}
            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</p>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {selectedOrder.customer?.name}
              </p>
              <p className="text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {selectedOrder.customer?.phone}
              </p>
              {selectedOrder.customer?.email && (
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedOrder.customer?.email}
                </p>
              )}
              {selectedOrder.customer?.deliveryAddress && (
                <p className="text-slate-500 flex items-start gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{selectedOrder.customer?.deliveryAddress}</span>
                </p>
              )}
            </div>

            {/* Items Ordered List with Images */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Items Ordered ({selectedOrder.items?.length || 0})
              </p>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={it.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                        alt={it.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{it.name}</p>
                        <p className="text-[10px] text-slate-400">Qty: {it.quantity} × ₹{it.price}</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">₹{it.total || it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal || selectedOrder.totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>₹{selectedOrder.discount || 0}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span>₹{selectedOrder.deliveryCharges || 0}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-100">
                <span className="text-sm font-bold">Total Amount</span>
                <span className="text-xl font-extrabold text-blue-600">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>

            {/* Update Order Status Dropdown */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Update Status</label>
              <select
                value={selectedOrder.orderStatus}
                onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value)}
                className="w-full text-xs font-semibold bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Bottom Actions matching screenshot */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => {
                  const storeHandle = selectedOrder.storeId?.handle || selectedOrder.storeId?.slug || 'my-store';
                  navigator.clipboard.writeText(`${window.location.origin}/store/${storeHandle}/track/${selectedOrder.orderNumber}`);
                  toast.success('Order tracking link copied to clipboard!');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Order</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
