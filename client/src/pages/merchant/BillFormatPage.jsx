import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export const BillFormatPage = () => {
  const { activeTenant } = useAuth();
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Customer info
  const [customerName, setCustomerName] = useState('Rahul Mehta');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [customerType, setCustomerType] = useState('Walk-in Customer');

  // Items in bill - starter sample items matching screenshot
  const [items, setItems] = useState([
    {
      productId: 'p1',
      name: 'Maggi Noodles',
      brand: 'Nestle',
      price: 12,
      costPrice: 9,
      quantity: 2,
      total: 24,
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=100&q=80',
    },
    {
      productId: 'p2',
      name: 'Coca Cola',
      brand: 'Coca Cola',
      price: 40,
      costPrice: 30,
      quantity: 1,
      total: 40,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=100&q=80',
    },
    {
      productId: 'p3',
      name: 'Lays Classic',
      brand: 'Lays',
      price: 20,
      costPrice: 15,
      quantity: 1,
      total: 20,
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=100&q=80',
    },
    {
      productId: 'p4',
      name: 'Amul Milk',
      brand: 'Amul',
      price: 28,
      costPrice: 24,
      quantity: 1,
      total: 28,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=100&q=80',
    },
  ]);

  // Payment & discount
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [discountType, setDiscountType] = useState('Percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [billFormat, setBillFormat] = useState('A4 - Standard');
  const [billNumber, setBillNumber] = useState('#1001');

  // Success notification
  const [successToast, setSuccessToast] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load products for live search
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.getProducts({ limit: 100 });
        if (res.success && res.data.products) {
          setAllProducts(res.data.products);
          // If items currently have placeholder IDs, link them to real product IDs if matching name
          setItems((prev) =>
            prev.map((it) => {
              const matched = res.data.products.find((p) => p.name.toLowerCase() === it.name.toLowerCase());
              return matched ? { ...it, productId: matched._id, costPrice: matched.costPrice } : it;
            })
          );
        }
      } catch (err) {
        console.error('Failed to load products for POS:', err);
      }
    };
    loadProducts();
  }, []);

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
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setDiscountValue(0);
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
      alert('Please add at least one item to save the bill.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        customerType,
        items,
        discountType: discountType.toLowerCase(),
        discountValue,
        paymentMethod: paymentMode,
        notes,
        billFormat,
      };

      const res = await api.createSale(payload);
      if (res.success) {
        if (res.data?.billNumber) setBillNumber(res.data.billNumber);
        setSuccessToast(true);
        setTimeout(() => setSuccessToast(false), 3000);
      }
    } catch (err) {
      alert(`Error saving bill: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">Bill {billNumber} saved and inventory updated!</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Bill</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Create a new bill for your customer. Select items, quantity and payment details.
        </p>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Inputs, Items, Payment) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Customer Details (Optional) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Customer Details (Optional)</h2>

            {/* Customer Search & Quick Add */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone...."
                  className="w-full bg-[#f8fafc] text-xs text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Customer</span>
              </button>
            </div>

            {/* Customer Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Mehta"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Customer Type</label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                >
                  <option>Walk-in Customer</option>
                  <option>Regular</option>
                  <option>VIP</option>
                  <option>Wholesale</option>
                </select>
              </div>
            </div>
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
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { mode: 'Cash', icon: Banknote },
                    { mode: 'Card', icon: CreditCard },
                    { mode: 'UPI', icon: QrCode },
                    { mode: 'Other', icon: MoreHorizontal },
                  ].map(({ mode, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        paymentMode === mode
                          ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
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
                  <h3 className="font-extrabold text-slate-900 text-base">{activeTenant?.name || 'MyStore'}</h3>
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  <p>123 Market Street, Bangalore</p>
                  <p>Karnataka - 560001</p>
                  <p>Phone: {activeTenant?.contactPhone || '9876543210'}</p>
                  <p>Email: {activeTenant?.contactEmail || 'mystore@gmail.com'}</p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Bill No: {billNumber}</p>
                <p className="text-slate-500">{currentDateFormatted}, {currentTimeFormatted}</p>
                <p className="font-medium">Customer: {customerName || 'Walk-in'}</p>
                {customerPhone && <p className="text-slate-500">Phone: {customerPhone}</p>}
                <p className="text-[10px] text-slate-400">Type: {customerType}</p>
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

              <p className="text-[10px] text-slate-400 font-medium pt-1">Visit again | MyStore</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
