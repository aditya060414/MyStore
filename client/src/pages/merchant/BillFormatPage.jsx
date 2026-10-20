import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Banknote,
  CreditCard,
  QrCode,
  MoreHorizontal,
  ScanLine,
  Store,
  UserPlus,
  CheckCircle2,
  ChevronDown,
  Clock,
  User,
  AlertTriangle,
  X,
  Users,
} from 'lucide-react';

export const BillFormatPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusiness = activeBusiness || activeTenant;
  const [searchParams] = useSearchParams();

  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Customer info & selection
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerDoc, setSelectedCustomerDoc] = useState(null);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Quick Customer Creation Modal
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    creditLimit: '',
    paymentTerms: 'Due on Receipt',
    billingAddress: '',
  });
  const [quickCustomerSubmitting, setQuickCustomerSubmitting] = useState(false);

  // Items in bill - starts fresh and empty
  const [items, setItems] = useState([]);

  // Payment & discount
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidNowAmount, setPaidNowAmount] = useState('');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [billFormat, setBillFormat] = useState('A4 - Standard');
  const [billNumber, setBillNumber] = useState('New Bill');
  const [saving, setSaving] = useState(false);

  // Check URL params if customer pre-selected from customer profile
  useEffect(() => {
    const custIdParam = searchParams.get('customerId');
    const custNameParam = searchParams.get('customerName');
    const custPhoneParam = searchParams.get('customerPhone');

    if (custIdParam) {
      setSelectedCustomerId(custIdParam);
      if (custNameParam) setCustomerName(decodeURIComponent(custNameParam));
      if (custPhoneParam) setCustomerPhone(decodeURIComponent(custPhoneParam));

      const loadCust = async () => {
        try {
          const res = await api.getCustomer(custIdParam);
          if (res.success && res.data?.customer) {
            setSelectedCustomerDoc(res.data.customer);
            setCustomerName(res.data.customer.name);
            setCustomerPhone(res.data.customer.phone);
          }
        } catch (_) {}
      };
      loadCust();
    }
  }, [searchParams]);

  // Live customer search autocomplete
  useEffect(() => {
    if (!customerSearchInput.trim()) {
      setCustomerSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCustomerSearching(true);
      try {
        const res = await api.searchCustomers(customerSearchInput);
        if (res.success) {
          setCustomerSearchResults(res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsCustomerSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [customerSearchInput]);

  // Load products for live search
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res.success && res.data.products) {
          setAllProducts(res.data.products);
        }
      } catch (err) {
        console.error('Failed to load products for POS:', err);
      }
    };
    loadProducts();
  }, [currentBusiness?._id]);

  // Filter products as user types
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const query = productSearch.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.barcode && p.barcode.includes(query))
    );
    setSearchResults(filtered.slice(0, 5));
  }, [productSearch, allProducts]);

  const handleAddItem = (prod) => {
    const existingIndex = items.findIndex((it) => it.productId === prod._id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].price;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod._id,
          name: prod.name,
          brand: prod.brand || '',
          price: prod.sellingPrice,
          costPrice: prod.costPrice || 0,
          quantity: 1,
          total: prod.sellingPrice,
          image: prod.image,
        },
      ]);
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const handleUpdateQty = (index, delta) => {
    const updated = [...items];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
    } else {
      updated[index].quantity = newQty;
      updated[index].total = newQty * updated[index].price;
      setItems(updated);
    }
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setItems([]);
    setSelectedCustomerId(null);
    setSelectedCustomerDoc(null);
    setCustomerName('');
    setCustomerPhone('');
    setPaidNowAmount('');
    setCustomerSearchInput('');
    setNotes('');
    setDiscountValue(0);
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCustomerId(cust._id);
    setSelectedCustomerDoc(cust);
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setCustomerSearchInput('');
    setCustomerSearchResults([]);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerDoc(null);
    setCustomerName('');
    setCustomerPhone('');
    setPaidNowAmount('');
  };

  const handleQuickCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!quickCustomerForm.name.trim() || !quickCustomerForm.phone.trim()) {
      toast.warning('Name and phone number are required');
      return;
    }
    setQuickCustomerSubmitting(true);
    try {
      const res = await api.createCustomer({
        name: quickCustomerForm.name,
        phone: quickCustomerForm.phone,
        email: quickCustomerForm.email,
        creditLimit: Number(quickCustomerForm.creditLimit || 0),
        paymentTerms: quickCustomerForm.paymentTerms || 'Due on Receipt',
        billingAddress: quickCustomerForm.billingAddress,
        customerType: 'Offline',
      });
      if (res.success && res.data) {
        toast.success(`Customer "${res.data.name}" created!`);
        handleSelectCustomer(res.data);
        setIsQuickCustomerOpen(false);
        setQuickCustomerForm({
          name: '',
          phone: '',
          email: '',
          creditLimit: '',
          paymentTerms: 'Due on Receipt',
          billingAddress: '',
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    } finally {
      setQuickCustomerSubmitting(false);
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + it.total, 0);
  const discountAmount =
    discountType === 'Percentage'
      ? Math.round((subtotal * Number(discountValue || 0)) / 100)
      : Number(discountValue || 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const currentTimeFormatted = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleSaveBill = async () => {
    if (items.length === 0) {
      toast.warning('Please add at least one item to save the bill.');
      return;
    }

    if (paymentMode === 'Credit' && (!customerName || customerName === 'Walk-in Customer')) {
      toast.warning('Please select or register a customer for credit / pay later bills.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        customerType: 'Offline',
        channel: 'Offline',
        orderType: 'Offline',
        items,
        discountType: discountType.toLowerCase(),
        discountValue,
        paymentMethod: paymentMode,
        paidAmount: paymentMode === 'Credit' ? Number(paidNowAmount || 0) : totalAmount,
        notes,
        billFormat,
      };

      const res = await api.createSale(payload);
      if (res.success) {
        const savedBillNo = res.data?.billNumber || 'Bill';
        if (res.data?.billNumber) setBillNumber(res.data.billNumber);
        toast.success(`Bill ${savedBillNo} saved and recorded successfully!`);

        // If customer was linked, refresh customer stats
        if (selectedCustomerId) {
          try {
            const custRes = await api.getCustomer(selectedCustomerId);
            if (custRes.success && custRes.data?.customer) {
              setSelectedCustomerDoc(custRes.data.customer);
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      toast.error(`Error saving bill: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">POS / Billing</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Create a new bill for your customer. Select items, quantity and payment details.
        </p>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Inputs, Items, Payment) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Customer Details (Optional / Credit Account) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Customer Details (Optional)</h2>
              {selectedCustomerDoc && (
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Customer Linked
                </span>
              )}
            </div>

            {selectedCustomerDoc ? (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {selectedCustomerDoc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{selectedCustomerDoc.name}</span>
                      <span className="text-[11px] font-semibold text-slate-500">({selectedCustomerDoc.phone})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                      <span className="font-bold text-rose-600">
                        Due: ₹{(selectedCustomerDoc.outstandingDue || 0).toLocaleString('en-IN')}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 font-medium">{selectedCustomerDoc.paymentTerms || 'Due on Receipt'}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 bg-white border border-slate-200 transition-colors text-xs font-semibold cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Customer Search & Quick Add */}
                <div className="flex items-center gap-2 relative">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerSearchInput}
                      onChange={(e) => setCustomerSearchInput(e.target.value)}
                      placeholder="Search customer by name or phone..."
                      className="w-full bg-[#f8fafc] text-xs text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    {isCustomerSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent" />
                      </div>
                    )}

                    {/* Customer Autocomplete Dropdown */}
                    {customerSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-30 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {customerSearchResults.map((cust) => (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{cust.name}</div>
                              <div className="text-[11px] text-slate-400">{cust.phone}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] font-bold text-rose-600">
                                Due: ₹{(cust.outstandingDue || 0).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsQuickCustomerOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Customer</span>
                  </button>
                </div>

                {/* Customer Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Walk-in Customer"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Add Items Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Add Items</h2>

            {/* Search items & Barcode */}
            <div className="flex items-center gap-3 relative">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by item name, brand or barcode..."
                  className="w-full bg-[#f8fafc] text-xs text-slate-700 pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  title="Barcode Scanner"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  <ScanLine className="w-4 h-4" />
                </button>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 py-2 divide-y divide-slate-100">
                    {searchResults.map((prod) => (
                      <button
                        key={prod._id}
                        type="button"
                        onClick={() => handleAddItem(prod)}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-blue-50 text-left transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                            alt={prod.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{prod.name}</p>
                            <p className="text-[10px] text-slate-400">{prod.brand} • Stock: {prod.stock}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-blue-600">₹{prod.sellingPrice}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (allProducts.length > 0) handleAddItem(allProducts[0]);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 font-semibold">#</th>
                    <th className="py-2.5 font-semibold">Item</th>
                    <th className="py-2.5 font-semibold text-center">Price (₹)</th>
                    <th className="py-2.5 font-semibold text-center">Quantity</th>
                    <th className="py-2.5 font-semibold text-right">Total (₹)</th>
                    <th className="py-2.5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {items.map((it, idx) => (
                    <tr key={it.productId || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                            alt={it.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{it.name}</p>
                            <p className="text-[11px] text-slate-400">{it.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{it.price}</td>
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-800">{it.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">{it.total}</td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">
                        No items added yet. Search products or scan barcode above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Payment Details & Notes Split Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Payment Details */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Payment Details</h2>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { mode: 'Cash', icon: Banknote },
                    { mode: 'UPI', icon: QrCode },
                    { mode: 'Card', icon: CreditCard },
                    { mode: 'Credit', icon: Clock },
                    { mode: 'Other', icon: MoreHorizontal },
                  ].map(({ mode, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                        paymentMode === mode
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate text-[10px] sm:text-[11px]">{mode}</span>
                    </button>
                  ))}
                </div>

                {/* Due / Credit Sale Details */}
                {paymentMode === 'Credit' && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-800">Payment Terms:</span>
                      <span className="font-bold text-amber-900">
                        {selectedCustomerDoc?.paymentTerms || 'Due on Receipt'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Amount Paid Now (₹) <span className="text-slate-400 font-normal">(0 for full due)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalAmount}
                        placeholder="0"
                        value={paidNowAmount}
                        onChange={(e) => setPaidNowAmount(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60 font-bold text-rose-700">
                      <span>Remaining Balance Due:</span>
                      <span>₹{Math.max(0, totalAmount - Number(paidNowAmount || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Discount (Optional)</label>
                <div className="flex items-center gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="text-xs font-semibold bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                  >
                    <option>Percentage</option>
                    <option>Flat Amount</option>
                  </select>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full text-xs font-bold text-slate-800 bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                      {discountType === 'Percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clear All</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveBill}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Bill</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Bill</span>
                </button>
              </div>
            </div>

            {/* Notes (Optional) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-3 flex flex-col">
              <h2 className="text-sm font-bold text-slate-900">Notes (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className="flex-1 w-full bg-[#f8fafc] text-xs text-slate-700 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 resize-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column (Live Bill Preview Card) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5 sticky top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Bill Preview</h2>
            <select
              value={billFormat}
              onChange={(e) => setBillFormat(e.target.value)}
              className="text-xs font-semibold bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
            >
              <option>A4 - Standard</option>
              <option>Thermal 80mm</option>
            </select>
          </div>

          {/* Printable Invoice Container */}
          <div
            id="printable-bill"
            className="border border-slate-100 rounded-2xl p-6 bg-[#fdfdfd] shadow-sm space-y-5 font-sans"
          >
            {/* Store & Bill Info Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-dashed border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{currentBusiness?.name || 'BisonMooves Store'}</h3>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  <p>123 Market Street, Bangalore</p>
                  <p>Karnataka - 560001</p>
                  <p>Phone: {currentBusiness?.contactPhone || '9876543210'}</p>
                  <p>Email: {currentBusiness?.contactEmail || 'bisonmooves@gmail.com'}</p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Bill No: {billNumber}</p>
                <p className="text-slate-500">{currentDateFormatted}, {currentTimeFormatted}</p>
                <p className="font-medium">Customer: {customerName || 'Walk-in'}</p>
                {customerPhone && <p className="text-slate-500">Phone: {customerPhone}</p>}
                <p className="text-[10px] text-slate-400">Channel: Offline POS</p>
              </div>
            </div>

            {/* Receipt Table */}
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dashed border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2">#</th>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Price (₹)</th>
                  <th className="py-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-400">{idx + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {it.image && (
                          <img src={it.image} alt={it.name} className="w-6 h-6 rounded object-cover" />
                        )}
                        <span className="font-semibold text-slate-800">{it.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-center">{it.quantity}</td>
                    <td className="py-2 text-right">{it.price}</td>
                    <td className="py-2 text-right font-bold text-slate-900">{it.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-right text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount ({discountValue}%)</span>
                <span className="font-semibold">₹{discountAmount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-100">
                <span className="text-base font-bold">Total</span>
                <span className="text-2xl font-extrabold text-blue-600">₹{totalAmount}</span>
              </div>
            </div>

            {/* Footer Notice & Barcode */}
            <div className="border-t border-dashed border-slate-200 pt-4 text-center space-y-3">
              <p className="text-xs text-slate-700 font-semibold">Payment Mode: {paymentMode}</p>
              <p className="text-xs text-slate-500 font-medium">Thank you for shopping with us!</p>

              {/* Barcode Mock Rendering */}
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="flex items-center justify-center space-x-1 h-10">
                  {[4, 2, 6, 2, 5, 2, 4, 3, 2, 5, 2, 4, 2, 6, 3, 2, 4, 5, 2, 3, 6, 2].map((w, i) => (
                    <div
                      key={i}
                      className={`h-full bg-slate-900 ${i % 2 === 0 ? 'opacity-100' : 'opacity-80'}`}
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 mt-1">
                  {billNumber}-15092026
                </span>
              </div>

              <p className="text-[10px] text-slate-400 font-medium pt-1">Visit again | BisonMooves Store</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Quick Add Customer
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickCustomerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Sharma"
                  value={quickCustomerForm.name}
                  onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={quickCustomerForm.phone}
                  onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={quickCustomerForm.paymentTerms}
                  onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, paymentTerms: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="7 Days">7 Days</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Street / City"
                  value={quickCustomerForm.billingAddress}
                  onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, billingAddress: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCustomerSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {quickCustomerSubmitting ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
