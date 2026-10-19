import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  Search,
  Receipt,
  Boxes,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  FileText,
  CreditCard,
  Store,
  Globe,
  Phone,
  Mail,
  ShoppingBag,
  CheckCircle,
  ArrowUpRight,
} from 'lucide-react';

export const HistoryPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;
  const [logs, setLogs] = useState([]);
  const [movements, setMovements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'online', 'offline'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.getHistory({ search });
        if (res.success) {
          const fetchedLogs = res.data.logs || [];
          setLogs(fetchedLogs);
          setMovements(res.data.movements || []);
          setPayments(res.data.payments || []);
          // All details remain closed by default, opening only when clicked
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [search, currentBusinessId]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} · ${timePart}`;
  };

  const formatActionTitle = (action) => {
    if (!action) return 'Activity logged';
    const mapping = {
      BUSINESS_CONFIGURED: 'Business configuration updated',
      BUSINESS_ONBOARDED: 'Business onboarded',
      SALE_CREATED: 'POS sale bill generated',
      SALE_COMPLETED: 'Sale transaction completed',
      INVENTORY_ADJUSTED: 'Inventory stock adjusted',
      PRODUCT_CREATED: 'Product created',
      PRODUCT_UPDATED: 'Product updated',
      ORDER_CREATED: 'Online storefront order placed',
      ORDER_STATUS_UPDATED: 'Order status updated',
      SETTINGS_UPDATED: 'Store settings updated',
    };
    if (mapping[action]) return mapping[action];
    return action
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActionIcon = (action, details) => {
    if (action === 'BUSINESS_ONBOARDED') return PlusCircle;
    if (action === 'BUSINESS_CONFIGURED') {
      if (details?.plan && details.plan.toLowerCase().includes('pro')) {
        return Settings;
      }
      return FileText;
    }
    if (action?.includes('SALE') || action?.includes('ORDER')) return Receipt;
    if (action?.includes('INVENTORY') || action?.includes('STOCK')) return Boxes;
    return Settings;
  };

  const getSubtitle = (rec) => {
    const d = rec.details || {};
    if (d.businessName && d.storeName) {
      return `${d.businessName} · ${d.storeName}`;
    }
    if (d.businessName) return d.businessName;
    if (d.storeName) return d.storeName;
    if (d.billNumber) return `Bill #${d.billNumber} · Amount: ₹${d.totalAmount || 0}`;
    if (rec.entityType) return `${rec.entityType} Activity`;
    return 'Store activity';
  };

  const renderDetailsTable = (details) => {
    if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
      return <p className="text-xs text-slate-400 italic">No additional details recorded.</p>;
    }

    const priorityKeys = [
      { key: 'channel', label: 'Channel' },
      { key: 'paymentType', label: 'Payment Type' },
      { key: 'customerName', label: 'Customer Name' },
      { key: 'customerPhone', label: 'Customer Phone' },
      { key: 'customerEmail', label: 'Customer Email' },
      { key: 'billNumber', label: 'Bill / Order #' },
      { key: 'totalAmount', label: 'Total bill', format: (val) => `₹${val}` },
      { key: 'paymentMethod', label: 'Payment mode' },
      { key: 'itemsCount', label: 'Items count' },
      { key: 'businessName', label: 'Business name' },
      { key: 'storeName', label: 'Store name' },
      { key: 'plan', label: 'Plan' },
      { key: 'productName', label: 'Product Name' },
      { key: 'type', label: 'Activity Type' },
      { key: 'quantityDelta', label: 'Stock Change' },
      { key: 'previousStock', label: 'Previous Stock' },
      { key: 'newStock', label: 'Current Stock' },
      { key: 'reason', label: 'Description' },
      { key: 'performedBy', label: 'Updated By' },
    ];

    const renderedRows = [];
    const handledKeys = new Set(['items']);

    priorityKeys.forEach(({ key, label, format }) => {
      if (details[key] !== undefined && details[key] !== null && details[key] !== '') {
        handledKeys.add(key);
        const val = format ? format(details[key]) : String(details[key]);
        renderedRows.push({ label, value: val });
      }
    });

    Object.keys(details).forEach((k) => {
      if (!handledKeys.has(k) && details[k] !== undefined && details[k] !== null && typeof details[k] !== 'object') {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        renderedRows.push({ label, value: String(details[k]) });
      }
    });

    return (
      <div className="space-y-3">
        {renderedRows.length > 0 ? (
          <div className="space-y-2">
            {renderedRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs py-0.5">
                <div className="sm:col-span-3 text-slate-500 font-medium">{row.label}</div>
                <div className="sm:col-span-9 text-slate-800 font-semibold">{row.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No additional details recorded.</p>
        )}

        {/* Itemized List if available */}
        {Array.isArray(details.items) && details.items.length > 0 && (
          <div className="pt-3 border-t border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                Purchased Items ({details.items.length})
              </span>
              <span className="text-slate-500 font-normal">
                Total Bill: <strong className="text-slate-900 font-bold">₹{details.totalAmount || 0}</strong>
              </span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-center">Unit Price</th>
                    <th className="py-2 px-3 text-center">Quantity</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {details.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{it.name}</td>
                      <td className="py-2 px-3 text-center text-slate-600">₹{it.price}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                          x{it.quantity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        ₹{it.total || it.price * it.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Filter payments by online / offline
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter === 'online') return p.channelType === 'online';
    if (paymentFilter === 'offline') return p.channelType === 'offline';
    return true;
  });

  const totalPaymentsAmount = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const onlinePaymentsCount = payments.filter((p) => p.channelType === 'online').length;
  const offlinePaymentsCount = payments.filter((p) => p.channelType === 'offline').length;
  const onlineTotalAmount = payments.filter((p) => p.channelType === 'online').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const offlineTotalAmount = payments.filter((p) => p.channelType === 'offline').reduce((acc, p) => acc + (p.totalAmount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit & Payment History</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tamper-evident activity logs, online/offline payment records, items quantities, and stock movements.
        </p>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'payments', label: 'Payments' },
            { id: 'inventory', label: 'Stock Movements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, bill #, item..."
            className="w-full bg-[#f8fafc] text-xs text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 overflow-hidden">
          {logs.length > 0 ? (
            <div className="relative">
              {logs.map((rec, index) => {
                const Icon = getActionIcon(rec.action, rec.details);
                const isExpanded = !!expandedIds[rec._id || rec.id];

                return (
                  <div key={rec._id || rec.id || index} className="relative flex items-start gap-4 sm:gap-6 pb-7 last:pb-0">
                    {/* Vertical Connecting Timeline Line */}
                    {index < logs.length - 1 && (
                      <div className="absolute left-[17px] top-10 bottom-0 w-[1.5px] bg-slate-100" />
                    )}

                    {/* Circular Icon Node */}
                    <div className="relative z-10 w-9 h-9 rounded-full bg-blue-50/90 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Right Content Area */}
                    <div className="flex-1 min-w-0 pb-7 border-b border-slate-100 last:border-b-0 last:pb-0">
                      {/* Top Flex Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                              {formatActionTitle(rec.action)}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100/70">
                              {rec.entityType || 'Business'}
                            </span>
                            {rec.details?.channel && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  rec.details.channel.toLowerCase().includes('online')
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                }`}
                              >
                                {rec.details.channel.toLowerCase().includes('online') ? (
                                  <Globe className="w-3 h-3" />
                                ) : (
                                  <Store className="w-3 h-3" />
                                )}
                                {rec.details.channel}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-medium text-slate-600">
                            {getSubtitle(rec)}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {/* Changed by */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{rec.userName ? `By ${rec.userName}` : 'System'}</span>
                            </div>

                            {/* Plan Tag */}
                            {rec.details?.plan && (
                              rec.details.plan.toLowerCase().includes('pro') ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                                  <span>👑</span>
                                  <span>{rec.details.plan} plan</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                                  <FileText className="w-3 h-3 text-slate-500" />
                                  <span>{rec.details.plan} plan</span>
                                </span>
                              )
                            )}

                            {/* Total bill tag if present */}
                            {rec.details?.totalAmount !== undefined && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                Total Bill: ₹{rec.details.totalAmount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp & Accordion Button */}
                        <div className="flex flex-col items-end shrink-0 pt-0.5">
                          <span className="text-xs text-slate-400 font-normal">
                            {formatDateTime(rec.createdAt)}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleExpand(rec._id || rec.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-2 cursor-pointer"
                          >
                            <span>View details</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Container */}
                      {isExpanded && (
                        <div className="mt-4 bg-[#f8fafc] rounded-2xl p-5 border border-slate-200/60 shadow-xs transition-all">
                          {renderDetailsTable(rec.details)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No activity logged yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Audit records for bills generated, inventory updates, and store settings will be tracked here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payments Category Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          {/* Summary KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{totalPaymentsAmount.toLocaleString()}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{payments.length} total payments collected</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Online Payments</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{onlineTotalAmount.toLocaleString()}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{onlinePaymentsCount} store orders via UPI/Gateway</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Globe className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Offline POS Bills</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{offlineTotalAmount.toLocaleString()}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{offlinePaymentsCount} in-store checkout receipts</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Store className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sub-Filters Pill Bar */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: `All Transactions (${payments.length})` },
              { id: 'online', label: `Online Payments (${onlinePaymentsCount})` },
              { id: 'offline', label: `Offline POS (${offlinePaymentsCount})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPaymentFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  paymentFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Payments List Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const isExpanded = !!expandedIds[p._id || p.id];
                  const isOnline = p.channelType === 'online';

                  return (
                    <div key={p._id || p.id} className="py-5 first:pt-0 last:pb-0">
                      {/* Top Header Card */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          {/* Channel Icon */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                              isOnline
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            }`}
                          >
                            {isOnline ? <Globe className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                          </div>

                          {/* Customer Details & Bill Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                                {p.billNumber}
                              </span>

                              {/* Online or Offline Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  isOnline
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {isOnline ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                                {isOnline ? 'Online Store' : 'Offline POS'}
                              </span>

                              {/* Payment Mode */}
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70">
                                {p.paymentMethod}
                              </span>

                              {/* Status */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                {p.paymentStatus === 'paid' ? 'Paid' : p.paymentStatus}
                              </span>
                            </div>

                            {/* Customer Details Row */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{p.customerName}</span>
                              </div>

                              {p.customerPhone && (
                                <div className="flex items-center gap-1 text-slate-500 font-medium">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{p.customerPhone}</span>
                                </div>
                              )}

                              {p.customerEmail && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{p.customerEmail}</span>
                                </div>
                              )}

                              <span className="text-slate-400 font-normal">
                                · {p.itemsCount} {p.itemsCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Total Bill & View details toggle */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start shrink-0 pt-0.5">
                          <div className="text-right">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                              Total Bill
                            </span>
                            <span className="text-lg font-extrabold text-slate-900">
                              ₹{p.totalAmount.toLocaleString()}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleExpand(p._id || p.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mt-1.5 cursor-pointer"
                          >
                            <span>View details</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details (Items list with quantity of each and total bill) */}
                      {isExpanded && (
                        <div className="mt-4 bg-[#f8fafc] rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in zoom-in-95 duration-100">
                          {/* Heading */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  Items In This Bill ({p.items?.length || 0})
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Detailed breakdown of each item and quantity
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                              Total Quantity: {p.itemsCount || p.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} units
                            </span>
                          </div>

                          {/* Items List Table */}
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold">
                                  <th className="py-2.5 px-4">Item Name</th>
                                  <th className="py-2.5 px-4 text-center">Unit Price</th>
                                  <th className="py-2.5 px-4 text-center font-bold text-blue-700">Quantity of Each</th>
                                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {p.items && p.items.length > 0 ? (
                                  p.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-2.5 px-4 font-bold text-slate-900">{item.name}</td>
                                      <td className="py-2.5 px-4 text-center text-slate-600">₹{item.price}</td>
                                      <td className="py-2.5 px-4 text-center">
                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                                          x{item.quantity}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">
                                        ₹{item.total || item.price * item.quantity}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="py-4 text-center text-slate-400">
                                      No items recorded in this bill.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Customer & Total Bill Summary Card */}
                          <div className="bg-white rounded-xl p-4 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Customer & Channel Info */}
                            <div className="space-y-1.5 text-xs">
                              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px] text-slate-400">
                                Customer & Transaction Details
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500 font-medium">Customer:</span>
                                <span className="col-span-2 font-bold text-slate-800">{p.customerName}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500 font-medium">Phone:</span>
                                <span className="col-span-2 font-medium text-slate-700">{p.customerPhone || '—'}</span>
                              </div>
                              {p.customerEmail && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-slate-500 font-medium">Email:</span>
                                  <span className="col-span-2 font-medium text-slate-700">{p.customerEmail}</span>
                                </div>
                              )}
                              {p.customerAddress && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="text-slate-500 font-medium">Delivery Address:</span>
                                  <span className="col-span-2 font-medium text-slate-700">{p.customerAddress}</span>
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500 font-medium">Payment Channel:</span>
                                <span className="col-span-2 font-bold text-slate-900">
                                  {isOnline ? '🌐 Online Storefront' : '🏪 Offline In-Store POS'}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500 font-medium">Payment Mode:</span>
                                <span className="col-span-2 font-bold text-slate-800">{p.paymentMethod}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500 font-medium">Staff / Cashier:</span>
                                <span className="col-span-2 text-slate-600">{p.cashierName}</span>
                              </div>
                            </div>

                            {/* Total Bill Summary */}
                            <div className="space-y-2 text-xs md:border-l md:pl-5 border-slate-100">
                              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100 uppercase tracking-wider text-[10px] text-slate-400">
                                Total Bill Breakdown
                              </span>
                              <div className="flex justify-between items-center text-slate-600">
                                <span>Items Subtotal:</span>
                                <span className="font-semibold text-slate-800">₹{p.subtotal || p.totalAmount}</span>
                              </div>
                              {p.discountAmount > 0 && (
                                <div className="flex justify-between items-center text-emerald-600 font-medium">
                                  <span>Discount:</span>
                                  <span>-₹{p.discountAmount}</span>
                                </div>
                              )}
                              {p.taxAmount > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>Tax / GST:</span>
                                  <span>+₹{p.taxAmount}</span>
                                </div>
                              )}
                              {p.deliveryCharges > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>Delivery Fee:</span>
                                  <span>+₹{p.deliveryCharges}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                <span className="font-bold text-slate-900 text-sm">Total Bill:</span>
                                <span className="text-lg font-extrabold text-emerald-600">₹{p.totalAmount}</span>
                              </div>
                              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Payment Status:</span>
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Paid
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Transactions completed through online orders or in-store POS checkout will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Movements Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Inventory Shift Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-600 font-bold">
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Activity Type</th>
                  <th className="py-3.5 px-4 text-center">Stock Change</th>
                  <th className="py-3.5 px-4 text-center">Previous Stock</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Updated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.productName}</td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={m.quantityDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">{m.previousStock}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{m.newStock}</td>
                    <td className="py-3 px-4 text-slate-500">{m.reason}</td>
                    <td className="py-3 px-4 text-slate-600">{m.performedBy}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
