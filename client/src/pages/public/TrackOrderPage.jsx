import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Store,
  MapPin,
  Phone,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Copy,
  Receipt,
  AlertCircle,
  CreditCard,
  ShoppingBag,
  Mail,
} from 'lucide-react';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';

export const TrackOrderPage = () => {
  const { storeHandle, orderNumber: urlOrderNumber } = useParams();
  const navigate = useNavigate();

  const [inputOrderNumber, setInputOrderNumber] = useState(urlOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async (orderIdToFetch, isRefresh = false) => {
    if (!orderIdToFetch || !orderIdToFetch.trim()) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const res = await api.trackPublicOrder(orderIdToFetch.trim());
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.message || 'Order not found');
        setOrder(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to locate order');
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (urlOrderNumber) {
      setInputOrderNumber(urlOrderNumber);
      fetchOrder(urlOrderNumber);
    }
  }, [urlOrderNumber]);

  // Auto-poll every 8 seconds for live updates while order is active
  useEffect(() => {
    if (!order?.orderNumber) return;
    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') return;

    const interval = setInterval(() => {
      fetchOrder(order.orderNumber, true);
    }, 8000);

    return () => clearInterval(interval);
  }, [order?.orderNumber, order?.orderStatus]);

  // Celebrate when order reaches Delivered status
  useEffect(() => {
    if (order?.orderStatus === 'Delivered') {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  }, [order?.orderStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputOrderNumber.trim()) return;

    if (storeHandle) {
      navigate(`/store/${storeHandle}/track/${encodeURIComponent(inputOrderNumber.trim())}`);
    } else {
      navigate(`/track/${encodeURIComponent(inputOrderNumber.trim())}`);
    }
    fetchOrder(inputOrderNumber);
  };

  const handleCopyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    toast.success('Order number copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Delivered',
        };
      case 'Shipped':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500 animate-pulse',
          icon: Truck,
          label: 'Out for Delivery',
        };
      case 'Processing':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500 animate-pulse',
          icon: Package,
          label: 'In Preparation',
        };
      case 'Cancelled':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
          label: 'Cancelled',
        };
      case 'Pending':
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
          icon: Clock,
          label: 'Order Placed',
        };
    }
  };

  const storeInfo = order?.storeId || {};
  const currentTracking = order?.tracking || {};
  const currentStatus = order?.orderStatus || 'Pending';
  const statusBadgeInfo = getStatusBadge(currentStatus);
  const StatusIcon = statusBadgeInfo.icon;

  const resolvedStoreHandle = storeHandle || storeInfo.handle || storeInfo.slug || '';
  const backToStoreUrl = resolvedStoreHandle ? `/store/${resolvedStoreHandle}` : '/';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link
            to={backToStoreUrl}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          <div className="flex items-center gap-2 text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-extrabold text-xs text-slate-900 leading-tight">
                {storeInfo.name || 'Store Order Tracking'}
              </p>
              <p className="text-[10px] text-slate-400">Live Customer Order Tracking</p>
            </div>
          </div>

          {order && (
            <button
              onClick={() => fetchOrder(order.orderNumber, true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Search Order Bar Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Track Your Order</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your order ID (e.g. <span className="font-semibold text-slate-700">#ORD1001</span> or{' '}
                <span className="font-semibold text-slate-700">1001</span>) to view real-time delivery status.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputOrderNumber}
                  onChange={(e) => setInputOrderNumber(e.target.value)}
                  placeholder="Order ID e.g. #ORD1001"
                  className="w-full bg-[#f8fafc] text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </form>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs font-semibold text-slate-600">Fetching order status & details...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-3xl p-10 border border-rose-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {error}. Please double-check your order ID or contact the store directly.
            </p>
          </div>
        )}

        {/* Order Details & Live Status Container */}
        {!loading && order && (
          <div className="space-y-6">
            {/* 1. Live Status Hero Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID:</span>
                    <span className="font-extrabold text-base text-slate-900 font-mono">{order.orderNumber}</span>
                    <button
                      onClick={handleCopyOrderNumber}
                      title="Copy Order ID"
                      className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${statusBadgeInfo.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusBadgeInfo.dot}`}></span>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{statusBadgeInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Status Headline */}
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {currentTracking.headline || statusBadgeInfo.label}
                </h2>
                <p className="text-xs text-slate-500">
                  {currentTracking.subheadline || 'Track the preparation and delivery journey of your order.'}
                </p>
              </div>

              {/* Progress Bar (if not cancelled) */}
              {!currentTracking.isCancelled && (
                <div className="space-y-2">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentStatus === 'Delivered'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                      style={{ width: `${currentTracking.progressPercent || 25}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Visual Stepper Timeline */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Order Progression
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {(currentTracking.timeline || []).map((step, idx) => {
                    const isDone = step.isCompleted;
                    const isCurr = step.isCurrent;
                    const isDelivered = currentStatus === 'Delivered';
                    const isDeliveredStep = step.status === 'Delivered';

                    let cardClass = 'bg-white border-dashed border-slate-200 opacity-60';
                    let iconBgClass = 'bg-slate-200 text-slate-500';
                    let textClass = 'text-slate-800 font-medium';

                    if (isDeliveredStep && isDelivered) {
                      cardClass = 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/15 shadow-sm';
                      iconBgClass = 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/25';
                      textClass = 'text-emerald-900 font-extrabold';
                    } else if (isCurr && !isDelivered) {
                      cardClass = 'bg-blue-50/60 border-blue-200 ring-2 ring-blue-500/15 shadow-sm';
                      iconBgClass = 'bg-blue-600 text-white shadow-sm shadow-blue-500/20';
                      textClass = 'text-blue-700 font-bold';
                    } else if (isDone) {
                      cardClass = 'bg-slate-50/90 border-slate-200/90';
                      iconBgClass = 'bg-emerald-600 text-white';
                      textClass = 'text-slate-800 font-bold';
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${cardClass}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${iconBgClass}`}>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs ${textClass}`}>
                            {step.title}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug">{step.description}</p>

                        {step.timestamp && (
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">
                            {new Date(step.timestamp).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Customer & Delivery Info + Order Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left: Ordered Items List */}
              <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    <span>Items Ordered ({order.items?.length || 0})</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Channel: Online Store</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'
                          }
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Qty: {item.quantity} × ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.total || item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-medium text-slate-800">₹{order.subtotal || order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges:</span>
                    <span className="font-medium text-slate-800">
                      {order.deliveryCharges ? `₹${order.deliveryCharges}` : 'Free Delivery'}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-₹{order.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-dashed border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Right: Delivery & Store Contacts */}
              <div className="md:col-span-5 space-y-5">
                {/* Customer & Delivery Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3 text-xs">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider text-slate-400">
                    Delivery Address & Customer
                  </h3>

                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 text-sm">{order.customer?.name}</p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customer?.phone}</span>
                    </p>
                    {order.customer?.email && (
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.customer?.email}</span>
                      </p>
                    )}
                    {order.customer?.deliveryAddress && (
                      <p className="text-slate-600 flex items-start gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{order.customer?.deliveryAddress}</span>
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      {order.paymentMethod || 'UPI'} ({order.paymentStatus || 'paid'})
                    </span>
                  </div>
                </div>

                {/* Store Contact Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-5 border border-blue-100 shadow-sm space-y-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">
                        {storeInfo.name || 'Store Merchant'}
                      </p>
                      <p className="text-[11px] text-slate-500">Need help with your order?</p>
                    </div>
                  </div>

                  {storeInfo.phone && (
                    <a
                      href={`tel:${storeInfo.phone}`}
                      className="w-full py-2.5 px-3 rounded-xl bg-white border border-blue-200 text-blue-700 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Store: {storeInfo.phone}</span>
                    </a>
                  )}

                  <Link
                    to={backToStoreUrl}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
                  >
                    <span>Continue Shopping</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackOrderPage;
