import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Clock,
  Edit2,
  Archive,
  RotateCcw,
  Plus,
  Eye,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Store,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  Layers,
  Banknote,
  DollarSign,
  Package,
} from 'lucide-react';

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'ledger' | 'payments'

  // Tab Data States
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderChannelFilter, setOrderChannelFilter] = useState('all');

  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    billingAddress: '',
    deliveryAddress: '',
    creditLimit: '',
    paymentTerms: 'Due on Receipt',
    notes: '',
    status: 'Active',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    notes: '',
    allocations: [],
  });
  const [customerDuesList, setCustomerDuesList] = useState([]);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Fetch Customer Profile Overview
  const fetchCustomerProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomer(id);
      if (res.success) {
        setCustomerData(res.data);
        const c = res.data.customer;
        setEditFormData({
          name: c.name || '',
          phone: c.phone || '',
          email: c.email || '',
          billingAddress: c.billingAddress || c.address || '',
          deliveryAddress: c.deliveryAddress || '',
          creditLimit: c.creditLimit !== undefined ? c.creditLimit : '',
          paymentTerms: c.paymentTerms || 'Due on Receipt',
          notes: c.notes || '',
          status: c.status || 'Active',
        });
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
      toast.error('Customer not found');
      navigate('/app/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [id, currentBusinessId]);

  // Fetch Tab Specific Data
  useEffect(() => {
    if (!id) return;

    if (activeTab === 'overview') {
      const loadTimeline = async () => {
        setTimelineLoading(true);
        try {
          const res = await api.getCustomerTimeline(id);
          if (res.success) setTimeline(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setTimelineLoading(false);
        }
      };
      loadTimeline();
    } else if (activeTab === 'orders') {
      const loadOrders = async () => {
        setOrdersLoading(true);
        try {
          const res = await api.getCustomerOrders(id, { channel: orderChannelFilter });
          if (res.success) setOrders(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setOrdersLoading(false);
        }
      };
      loadOrders();
    } else if (activeTab === 'ledger') {
      const loadLedger = async () => {
        setLedgerLoading(true);
        try {
          const res = await api.getCustomerLedger(id, {
            search: ledgerSearch,
            startDate: ledgerStartDate,
            endDate: ledgerEndDate,
          });
          if (res.success) setLedgerData(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLedgerLoading(false);
        }
      };
      loadLedger();
    } else if (activeTab === 'payments') {
      const loadPayments = async () => {
        setPaymentsLoading(true);
        try {
          const res = await api.getCustomerPayments(id);
          if (res.success) setPayments(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setPaymentsLoading(false);
        }
      };
      loadPayments();
    }
  }, [activeTab, id, orderChannelFilter, ledgerSearch, ledgerStartDate, ledgerEndDate]);

  // Open Payment Modal
  const openPaymentModal = async () => {
    try {
      const res = await api.getCustomerDues(id);
      if (res.success) {
        const dues = res.data.duesList || [];
        const total = dues.reduce((sum, d) => sum + d.balanceDue, 0);
        setCustomerDuesList(dues);
        setPaymentData({
          amount: total > 0 ? String(total) : '',
          paymentMethod: 'Cash',
          paymentDate: new Date().toISOString().slice(0, 10),
          referenceNumber: '',
          notes: '',
          allocations: dues.map((d) => ({
            saleId: d.saleId,
            billNumber: d.billNumber,
            balanceDue: d.balanceDue,
            allocatedAmount: d.balanceDue,
          })),
        });
        setIsPaymentModalOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load outstanding dues.');
    }
  };

  // Submit Payment Record
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const num = Number(paymentData.amount);
    if (!num || num <= 0) {
      toast.warning('Please enter a valid amount');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await api.recordCustomerPayment(id, {
        amount: num,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        allocations: paymentData.allocations.filter((a) => Number(a.allocatedAmount) > 0),
      });

      if (res.success) {
        toast.success(res.message || 'Payment recorded!');
        setIsPaymentModalOpen(false);
        fetchCustomerProfile();
        if (activeTab === 'ledger') {
          const lRes = await api.getCustomerLedger(id);
          if (lRes.success) setLedgerData(lRes.data);
        } else if (activeTab === 'payments') {
          const pRes = await api.getCustomerPayments(id);
          if (pRes.success) setPayments(pRes.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment recording failed');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Submit Edit Customer
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.warning('Customer name is required');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await api.updateCustomer(id, editFormData);
      if (res.success) {
        toast.success('Customer details updated!');
        setIsEditModalOpen(false);
        fetchCustomerProfile();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Archive / Restore
  const handleToggleArchive = async () => {
    const isArchived = customer?.status === 'Archived';
    if (isArchived) {
      try {
        const res = await api.restoreCustomer(id);
        if (res.success) {
          toast.success('Customer restored to Active');
          fetchCustomerProfile();
        }
      } catch (err) {
        toast.error(err.message);
      }
    } else {
      if (window.confirm(`Archive "${customer?.name}"? Financial history will be preserved.`)) {
        try {
          const res = await api.archiveCustomer(id);
          if (res.success) {
            toast.info('Customer archived');
            fetchCustomerProfile();
          }
        } catch (err) {
          toast.error(err.message);
        }
      }
    }
  };

  // Export Ledger to CSV
  const handleExportLedgerCSV = () => {
    if (!ledgerData?.entries || ledgerData.entries.length === 0) {
      toast.info('No ledger entries to export');
      return;
    }

    let csv = `data:text/csv;charset=utf-8,`;
    csv += `Customer Ledger Statement - ${customer?.name} (${customer?.phone})\n`;
    csv += `Generated On: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    csv += `Date,Reference,Transaction Type,Debit (INR),Credit (INR),Running Balance (INR),Notes\n`;

    ledgerData.entries.forEach((e) => {
      const d = new Date(e.date).toLocaleDateString('en-IN');
      csv += `"${d}","${e.reference}","${e.transactionType}","${e.debit || 0}","${e.credit || 0}","${e.runningBalance}","${e.notes || ''}"\n`;
    });

    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Customer_Ledger_${customer?.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Statement Window
  const handlePrintStatement = () => {
    window.print();
  };

  if (loading && !customerData) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center space-y-3 py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Loading customer account...</p>
      </div>
    );
  }

  const customer = customerData?.customer || {};
  const metrics = customerData?.metrics || {};
  const hasDue = (metrics.outstandingDue || 0) > 0;

  // Get Initials
  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/customers')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Quick POS Billing Link */}
          <Link
            to={`/app/bill-format?customerId=${customer._id}&customerName=${encodeURIComponent(
              customer.name || ''
            )}&customerPhone=${encodeURIComponent(customer.phone || '')}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>New POS Bill</span>
          </Link>

          {hasDue && (
            <button
              onClick={openPaymentModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleArchive}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title={customer.status === 'Active' ? 'Archive Customer' : 'Restore Customer'}
          >
            {customer.status === 'Active' ? <Archive className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-md shadow-blue-500/20">
              {getInitials(customer.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    customer.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {customer.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-blue-500" /> {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                  </span>
                )}
                {(customer.billingAddress || customer.address) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {customer.billingAddress || customer.address}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> Added{' '}
                  {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Balance Status Pill */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col items-end">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outstanding Due</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              ₹{(metrics.outstandingDue || 0).toLocaleString('en-IN')}
            </div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  metrics.dueStatus === 'Overdue'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : metrics.dueStatus === 'Credit Limit Reached'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : metrics.dueStatus === 'Due'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {metrics.dueStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchases</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              ₹{(metrics.totalSpend || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{metrics.totalOrdersCount || 0} completed orders</span>
              <span>•</span>
              <span>Avg ₹{(metrics.avgOrderValue || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payments Made</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600">
              ₹{(metrics.totalPaid || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Settled bills & cash payments</p>
          </div>
        </div>

        {/* Overdue Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Balance</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600">
              ₹{(metrics.overdueBalance || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {metrics.nextDueDate
                ? `Next due: ${new Date(metrics.nextDueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}`
                : 'No overdue bills'}
            </p>
          </div>
        </div>

        {/* Total Outstanding Due */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
            <div className={`p-2 rounded-xl ${hasDue ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold ${hasDue ? 'text-amber-600' : 'text-slate-900'}`}>
              ₹{(metrics.outstandingDue || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span>Payment Terms:</span>
              <span className="font-semibold text-slate-700">{customer.paymentTerms || 'Due on Receipt'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Overview & Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders & Purchases</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Customer Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Receipts</span>
        </button>
      </div>

      {/* Tab 1: Overview & Activity Timeline */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Account Details & Terms */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              Account Information
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Full Name</span>
                <span className="text-slate-800 font-bold">{customer.name}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Primary Phone</span>
                <span className="text-slate-800 font-bold">{customer.phone}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Email</span>
                <span className="text-slate-800 font-medium">{customer.email || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Billing Address</span>
                <span className="text-slate-800 font-medium">{customer.billingAddress || customer.address || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Delivery Address</span>
                <span className="text-slate-800 font-medium">{customer.deliveryAddress || 'Same as billing'}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Payment Terms</span>
                <span className="text-slate-800 font-bold">{customer.paymentTerms || 'Due on Receipt'}</span>
              </div>

              {customer.notes && (
                <div>
                  <span className="text-slate-400 font-semibold block">Remarks / Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1 italic">
                    "{customer.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Activity Timeline */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span>Customer Activity Timeline</span>
              <span className="text-xs text-slate-400 font-normal">All historical events</span>
            </h2>

            {timelineLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading activity timeline...</div>
            ) : timeline.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No activity recorded yet.</div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((evt, idx) => {
                  const dateStr = new Date(evt.date).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{evt.title}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{dateStr}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{evt.description}</p>
                        {evt.amount !== null && (
                          <div className="text-slate-900 font-extrabold mt-1">
                            Amount: ₹{Number(evt.amount).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Orders & Purchases */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Purchase History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete list of POS bills and online storefront orders
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={orderChannelFilter}
                onChange={(e) => setOrderChannelFilter(e.target.value)}
                className="bg-slate-50 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="all">All Channels</option>
                <option value="POS">In-Store (POS)</option>
                <option value="Online">Online Storefront</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Receipt / Bill #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3 text-center">Items</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No purchases found for this customer.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{ord.orderNumber}</td>
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {new Date(ord.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            ord.channel === 'Online'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {ord.channel === 'Online' ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          {ord.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">{ord.itemCount}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        ₹{ord.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                        ₹{ord.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                        ₹{ord.balanceDue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ord.paymentStatus === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedReceipt(ord)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Sold Items"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customer Financial Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Debit represents sales owed; Credit represents payments received.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportLedgerCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrintStatement}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>

          {/* Ledger Summary Header */}
          {ledgerData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Total Charges (Debits)</span>
                <span className="text-lg font-bold text-slate-900">
                  ₹{ledgerData.summary.totalDebits.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Total Payments (Credits)</span>
                <span className="text-lg font-bold text-emerald-600">
                  ₹{ledgerData.summary.totalCredits.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Closing Outstanding Balance</span>
                <span className="text-lg font-extrabold text-rose-600">
                  ₹{ledgerData.summary.closingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference #</th>
                  <th className="py-2.5 px-3">Transaction</th>
                  <th className="py-2.5 px-3 text-right">Debit (Owed)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Paid)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No ledger entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledgerData.entries.map((ent) => (
                    <tr key={ent._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                        {new Date(ent.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{ent.reference}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ent.transactionType === 'Payment Received'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ent.transactionType === 'Credit Sale'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {ent.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {ent.debit > 0 ? `₹${ent.debit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                        {ent.credit > 0 ? `₹${ent.credit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        ₹{ent.runningBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{ent.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Payment Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment Receipts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All settlements received from {customer.name}
              </p>
            </div>
            {hasDue && (
              <button
                onClick={openPaymentModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Payment</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Payment #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Reference / UTR</th>
                  <th className="py-2.5 px-3">Settled Bills</th>
                  <th className="py-2.5 px-3">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsLoading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Loading payment records...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">{p.referenceNumber || '—'}</td>
                      <td className="py-3 px-3 text-slate-700">
                        {p.allocations?.length > 0
                          ? p.allocations.map((a) => a.billNumber).join(', ')
                          : 'General credit'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{p.receivedBy?.name || 'Staff'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Items Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Receipt {selectedReceipt.orderNumber}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(selectedReceipt.date).toLocaleString('en-IN')} • {selectedReceipt.channel}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto">
              {(selectedReceipt.items || []).map((it, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{it.name}</span>
                    <span className="text-slate-400 ml-1.5">× {it.quantity}</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    ₹{Number(it.total || it.price * it.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{selectedReceipt.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {selectedReceipt.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{selectedReceipt.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Amount:</span>
                <span>₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" /> Edit Customer Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={editFormData.paymentTerms}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows="2"
                  value={editFormData.billingAddress}
                  onChange={(e) => setEditFormData({ ...editFormData, billingAddress: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {editSubmitting ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> Record Due Payment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receiving payment from <span className="font-bold text-slate-800">{customer.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / UTR #</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR12345678"
                    value={paymentData.referenceNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {customerDuesList?.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Settling Outstanding Bills ({customerDuesList.length})
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="py-2 px-3">Bill #</th>
                          <th className="py-2 px-3 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerDuesList.map((d) => (
                          <tr key={d.saleId}>
                            <td className="py-2 px-3 font-bold text-slate-800">{d.billNumber}</td>
                            <td className="py-2 px-3 text-right font-extrabold text-rose-600">
                              ₹{d.balanceDue.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{paymentSubmitting ? 'Recording...' : 'Record Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
