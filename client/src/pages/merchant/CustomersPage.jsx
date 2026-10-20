import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Receipt,
  CreditCard,
  Archive,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShoppingBag,
  Clock,
  CircleDollarSign,
  UserCheck,
  TrendingUp,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';

export const CustomersPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [summaryCards, setSummaryCards] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    customersWithDues: 0,
    totalOutstandingAmount: 0,
    newCustomersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [hasDuesFilter, setHasDuesFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDuesData, setCustomerDuesData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    billingAddress: '',
    deliveryAddress: '',
    creditLimit: '',
    paymentTerms: 'Due on Receipt',
    notes: '',
    openingBalance: '',
    status: 'Active',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Duplicate prompt modal
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    notes: '',
    allocations: [],
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Load Customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        status: statusFilter,
        hasDues: hasDuesFilter === 'all' ? undefined : hasDuesFilter === 'yes' ? 'true' : 'false',
        sortBy,
        sortOrder,
        page,
        limit,
      };

      const res = await api.getCustomers(params);
      if (res.success) {
        setCustomers(res.data.customers || []);
        if (res.data.summaryCards) {
          setSummaryCards(res.data.summaryCards);
        }
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setTotalRecords(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, hasDuesFilter, sortBy, sortOrder, page, limit, currentBusinessId]);

  // Handle Form Change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      billingAddress: '',
      deliveryAddress: '',
      creditLimit: '',
      paymentTerms: 'Due on Receipt',
      notes: '',
      openingBalance: '',
      status: 'Active',
    });
    setDuplicateMatch(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (cust) => {
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      billingAddress: cust.billingAddress || cust.address || '',
      deliveryAddress: cust.deliveryAddress || '',
      creditLimit: cust.creditLimit !== undefined ? cust.creditLimit : '',
      paymentTerms: cust.paymentTerms || 'Due on Receipt',
      notes: cust.notes || '',
      status: cust.status || 'Active',
    });
    setIsEditModalOpen(true);
  };

  // Open Record Payment Modal
  const openPaymentModal = async (cust) => {
    setSelectedCustomer(cust);
    setPaymentSubmitting(false);
    try {
      const res = await api.getCustomerDues(cust._id);
      if (res.success) {
        setCustomerDuesData(res.data);
        const dues = res.data.duesList || [];
        const totalDue = dues.reduce((sum, d) => sum + d.balanceDue, 0);

        setPaymentData({
          amount: totalDue > 0 ? String(totalDue) : '',
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
      toast.error('Failed to load customer outstanding dues.');
    }
  };

  // Submit Add Customer
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.warning('Name and phone number are required');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await api.createCustomer(formData);
      if (res.success) {
        toast.success(`Customer "${res.data.name}" added successfully!`);
        setIsAddModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        // Trigger duplicate alert with link to existing customer
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Failed to add customer');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit Customer
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('Customer name is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await api.updateCustomer(selectedCustomer._id, formData);
      if (res.success) {
        toast.success('Customer details updated successfully!');
        setIsEditModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Archive Customer
  const handleArchive = async (cust) => {
    if (window.confirm(`Are you sure you want to archive customer "${cust.name}"? Their financial ledger will be preserved.`)) {
      try {
        const res = await api.archiveCustomer(cust._id);
        if (res.success) {
          toast.info(`Customer "${cust.name}" archived.`);
          fetchCustomers();
        }
      } catch (err) {
        toast.error(err.message || 'Failed to archive customer');
      }
    }
  };

  // Restore Customer
  const handleRestore = async (cust) => {
    try {
      const res = await api.restoreCustomer(cust._id);
      if (res.success) {
        toast.success(`Customer "${cust.name}" restored to Active.`);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to restore customer');
    }
  };

  // Submit Payment Record
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(paymentData.amount);
    if (!numAmount || numAmount <= 0) {
      toast.warning('Please enter a valid payment amount');
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await api.recordCustomerPayment(selectedCustomer._id, {
        amount: numAmount,
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
        allocations: paymentData.allocations.filter((a) => Number(a.allocatedAmount) > 0),
      });

      if (res.success) {
        toast.success(res.message || 'Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Get Initials for Avatar
  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Manage your store customers, purchase histories, credit accounts, and ledger dues.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards (Actual Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{summaryCards.totalCustomers}</div>
            <p className="text-[11px] text-slate-400 mt-1">All registered profiles</p>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{summaryCards.activeCustomers}</div>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Non-archived accounts</p>
          </div>
        </div>

        {/* Customers with Outstanding Dues */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">With Dues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600">{summaryCards.customersWithDues}</div>
            <p className="text-[11px] text-slate-400 mt-1">Customers with pending dues</p>
          </div>
        </div>

        {/* Total Outstanding Amount */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dues</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600">
              ₹{(summaryCards.totalOutstandingAmount || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total pending dues from store sales</p>
          </div>
        </div>

        {/* New Customers This Month */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New This Month</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{summaryCards.newCustomersThisMonth}</div>
            <p className="text-[11px] text-indigo-600 mt-1 font-semibold">Joined current month</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 text-xs text-slate-800 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Dues Filter */}
          <div className="md:col-span-3">
            <select
              value={hasDuesFilter}
              onChange={(e) => {
                setHasDuesFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 text-xs font-medium text-slate-700 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Balances</option>
              <option value="yes">Has Outstanding Dues</option>
              <option value="no">Zero Dues (Paid Up)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 text-xs font-medium text-slate-700 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Active">Active Customers</option>
              <option value="Archived">Archived Customers</option>
              <option value="All">All Statuses</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-1">
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 px-3 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title={`Sorting: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Outstanding Due</th>
                <th className="py-3 px-4">Last Purchase</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                      <span>Loading customers directory...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No customers found</p>
                      <p className="text-xs text-slate-500">
                        {search || hasDuesFilter !== 'all'
                          ? 'Try clearing your search query or filters.'
                          : 'Get started by clicking "+ Add Customer" or generating a POS bill.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((cust) => {
                  const hasDue = (cust.outstandingDue || 0) > 0;
                  const lastDateFormatted = cust.lastPurchaseDate
                    ? new Date(cust.lastPurchaseDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={cust._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                            {getInitials(cust.name)}
                          </div>
                          <div>
                            <Link
                              to={`/app/customers/${cust._id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                            >
                              {cust.name}
                            </Link>
                            {cust.email && <div className="text-[11px] text-slate-400">{cust.email}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {cust.phone}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {cust.orderCount || 0}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{(cust.totalSpend || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                        ₹{(cust.totalPaid || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Outstanding Due */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {hasDue ? (
                          <span className="font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
                            ₹{(cust.outstandingDue || 0).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">₹0</span>
                        )}
                      </td>

                      {/* Last Purchase */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium text-[11px]">
                        {lastDateFormatted}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            cust.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/app/customers/${cust._id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Customer Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {hasDue && (
                            <button
                              onClick={() => openPaymentModal(cust)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Record Payment against Dues"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {cust.status === 'Active' ? (
                            <button
                              onClick={() => handleArchive(cust)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Archive Customer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(cust)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Restore Customer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-bold">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold">{Math.min(page * limit, totalRecords)}</span> of{' '}
              <span className="font-bold">{totalRecords}</span> customers
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className={`p-1.5 rounded-lg border border-slate-200 ${
                  page <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className={`p-1.5 rounded-lg border border-slate-200 ${
                  page >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Add New Customer
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="ramesh@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleFormChange}
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
                <label className="block font-semibold text-slate-700 mb-1">Opening Due Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleFormChange}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  name="billingAddress"
                  rows="2"
                  value={formData.billingAddress}
                  onChange={handleFormChange}
                  placeholder="Street address, city, pin code..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Address</label>
                <textarea
                  name="deliveryAddress"
                  rows="2"
                  value={formData.deliveryAddress}
                  onChange={handleFormChange}
                  placeholder="Leave empty if same as billing address"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Preferred delivery time, special remarks, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {formSubmitting ? 'Saving...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && selectedCustomer && (
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
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleFormChange}
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
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  name="billingAddress"
                  rows="2"
                  value={formData.billingAddress}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Address</label>
                <textarea
                  name="deliveryAddress"
                  rows="2"
                  value={formData.deliveryAddress}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
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
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {formSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedCustomer && customerDuesData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 overflow-y-auto max-h-[90vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> Record Due Payment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receiving payment from <span className="font-bold text-slate-800">{selectedCustomer.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-800">Total Outstanding Balance:</span>
              <span className="text-sm font-extrabold text-amber-900">
                ₹{(customerDuesData.totalOutstanding || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Amount (₹) <span className="text-rose-500">*</span>
                  </label>
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
                    <option value="Card">Credit/Debit Card</option>
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

              {/* Outstanding Bills Allocation List */}
              {customerDuesData.duesList?.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Outstanding Bills ({customerDuesData.duesList.length})
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="py-2 px-3">Bill #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerDuesData.duesList.map((d) => (
                          <tr key={d.saleId}>
                            <td className="py-2 px-3 font-bold text-slate-800">{d.billNumber}</td>
                            <td className="py-2 px-3 text-slate-500">
                              {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="py-2 px-3 text-right font-extrabold text-rose-600">
                              ₹{d.balanceDue.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    * The payment will be automatically allocated to settle oldest outstanding bills first.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Payment receipt note..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

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

export default CustomersPage;
