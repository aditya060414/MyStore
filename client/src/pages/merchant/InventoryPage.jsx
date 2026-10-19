import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import {
  Package,
  Boxes,
  Tag,
  Calendar,
  Search,
  Download,
  Plus,
  PlusCircle,
  ArrowRight,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const InventoryPage = () => {
  const { activeBusiness, activeTenant } = useAuth();
  const currentBusinessId = activeBusiness?._id || activeTenant?._id;
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    categoriesCount: 0,
    expiringSoonCount: 0,
  });
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
  });

  // Search & filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [brand, setBrand] = useState('All Brands');
  const [stockStatus, setStockStatus] = useState('Stock Status');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    sellingPrice: '',
    costPrice: '',
    stock: '',
    stockToAdd: '',
    adjustmentReason: '',
    barcode: '',
    expiryDate: '',
    image: '',
  });

  // Dedicated Add Stock Quick Action Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockToAdd, setStockToAdd] = useState('');
  const [stockReason, setStockReason] = useState('Supplier shipment / Restock');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        search,
        category: category !== 'All Categories' ? category : undefined,
        brand: brand !== 'All Brands' ? brand : undefined,
        stockStatus: stockStatus !== 'Stock Status' ? stockStatus : undefined,
        page,
        limit: 10,
      });

      if (res.success) {
        setProducts(res.data.products);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.filters) setFilters(res.data.filters);
        if (res.data.pagination) setTotalPages(res.data.pagination.pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, brand, stockStatus, page, currentBusinessId]);

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        name: prod.name,
        brand: prod.brand || '',
        category: prod.category || '',
        sellingPrice: prod.sellingPrice,
        costPrice: prod.costPrice || '',
        stock: prod.stock,
        stockToAdd: '',
        adjustmentReason: '',
        barcode: prod.barcode || '',
        expiryDate: prod.expiryDate ? prod.expiryDate.slice(0, 10) : '',
        image: prod.image || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        category: '',
        sellingPrice: '',
        costPrice: '',
        stock: '',
        stockToAdd: '',
        adjustmentReason: '',
        barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        expiryDate: '',
        image: '',
      });
    }
    setModalOpen(true);
  };

  const handleOpenAddStockModal = (prod) => {
    setStockProduct(prod);
    setStockToAdd('');
    setStockReason('Supplier shipment / Restock');
    setStockModalOpen(true);
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockProduct) return;
    const qty = Number(stockToAdd);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid stock quantity to add (at least 1)');
      return;
    }

    setStockSubmitting(true);
    try {
      const res = await api.addProductStock(stockProduct._id, {
        quantityToAdd: qty,
        reason: stockReason.trim() || 'Supplier shipment / Restock',
      });

      if (res.success) {
        const prev = Number(stockProduct.stock || 0);
        const next = prev + qty;
        toast.success(`Added +${qty} units! Stock updated: ${prev} → ${next}`);
        setStockModalOpen(false);
        fetchProducts();
      } else {
        toast.error(res.message || 'Failed to add stock');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update stock');
    } finally {
      setStockSubmitting(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
        toast.success('Product updated successfully!');
      } else {
        await api.createProduct(formData);
        toast.success('Product added successfully!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        toast.success('Product deleted successfully!');
        fetchProducts();
      } catch (err) {
        toast.error(err.message || 'Failed to delete product');
      }
    }
  };

  const handleExportCSV = () => {
    if (!products.length) return;
    const headers = ['Name', 'Brand', 'Category', 'Price', 'Stock', 'Barcode', 'Expiry'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      `"${p.brand}"`,
      `"${p.category}"`,
      p.sellingPrice,
      p.stock,
      `"${p.barcode}"`,
      p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mystore-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStockBadge = (stock) => {
    if (stock > 20) {
      return 'bg-[#dcfce7] text-[#15803d] border border-emerald-200';
    } else if (stock > 8) {
      return 'bg-[#fef3c7] text-[#b45309] border border-amber-200';
    } else {
      return 'bg-[#fee2e2] text-[#b91c1c] border border-rose-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all your store items, stock, and expiry dates.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* 4 Stat Cards Row (Matching screenshot exact styles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Items</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.totalItems}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Across all categories</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            +12%
          </span>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Low Stock Items</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.lowStockItems}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Items need restocking</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
            <ArrowUpRight className="w-3 h-3" />
            3
          </span>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Categories</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.categoriesCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Product categories</p>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 p-3.5 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Expiring Soon</p>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {stats.expiringSoonCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Items within 15 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name, brand or barcode..."
            className="w-full bg-[#f8fafc] text-xs text-slate-700 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Dropdowns & Export */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-medium bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option>All Categories</option>
            {filters.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="text-xs font-medium bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option>All Brands</option>
            {filters.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="text-xs font-medium bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option>Stock Status</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
            <option>Expiring Soon</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-[#f8fafc] text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Inventory Table (Matching screenshot layout) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Image</th>
                <th className="py-3 px-4 font-semibold">Item Name</th>
                <th className="py-3 px-4 font-semibold">Brand</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Price (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">Stock</th>
                <th className="py-3 px-4 font-semibold">Expiry Date</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {products.map((p, idx) => (
                <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-medium">{(page - 1) * 10 + idx + 1}</td>
                  <td className="py-3 px-4">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                      alt={p.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-100 shadow-sm"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.brand}</td>
                  <td className="py-3 px-4 text-slate-500">{p.category}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{p.sellingPrice}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStockBadge(p.stock)}`}>
                        {p.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenAddStockModal(p)}
                        className="p-1 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Add Stock (+)"
                      >
                        <Plus className="w-3.5 h-3.5 font-bold" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAddStockModal(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                        title="Add Stock (+)"
                      >
                        <Plus className="w-3 h-3 font-bold" />
                        <span>Add Stock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Boxes className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-700 text-sm">No inventory items yet</p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Start by clicking &quot;Add Product&quot; above to track your store stock and start billing.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {stats.totalItems === 0
              ? '0 items in inventory'
              : `Showing ${(page - 1) * 10 + 1} to ${Math.min(page * 10, stats.totalItems)} of ${stats.totalItems} items`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maggi Noodles"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Nestle"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Snacks"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="12"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="9"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {editingProduct && (
                <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Add to Current Stock (+)
                    </span>
                    <span className="text-slate-500 font-normal">Previous Stock: {editingProduct.stock} units</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={formData.stockToAdd || ''}
                      onChange={(e) => {
                        const add = e.target.value;
                        const newTotal = add && !isNaN(Number(add)) && Number(add) > 0 ? Number(editingProduct.stock) + Number(add) : editingProduct.stock;
                        setFormData({ ...formData, stockToAdd: add, stock: newTotal });
                      }}
                      placeholder="+ Enter units to add"
                      className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    {formData.stockToAdd && Number(formData.stockToAdd) > 0 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 whitespace-nowrap">
                        = {Number(editingProduct.stock) + Number(formData.stockToAdd)} total
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="8901058852372"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <ScanLine className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Quick Modal */}
      {stockModalOpen && stockProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Stock</h3>
                  <p className="text-xs text-slate-500">Increase product stock count</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary */}
            <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <img
                src={stockProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                alt={stockProduct.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{stockProduct.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span>{stockProduct.brand || 'General'}</span>
                  <span>·</span>
                  <span>{stockProduct.category || 'General'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Current</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                  {stockProduct.stock} units
                </span>
              </div>
            </div>

            <form onSubmit={handleAddStockSubmit} className="mt-4 space-y-4">
              {/* Dynamic Math Calculation Card */}
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-center">
                  <div className="flex-1">
                    <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Previous</span>
                    <span className="text-lg font-bold text-slate-700">{stockProduct.stock}</span>
                  </div>
                  <div className="text-slate-400 font-bold text-base px-1">+</div>
                  <div className="flex-1">
                    <span className="block text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Adding</span>
                    <span className="text-lg font-bold text-emerald-600">+{Number(stockToAdd) || 0}</span>
                  </div>
                  <div className="text-slate-400 font-bold text-base px-1">=</div>
                  <div className="flex-1 bg-white rounded-xl py-1 px-2 border border-emerald-200 shadow-xs">
                    <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">New Total</span>
                    <span className="text-lg font-extrabold text-emerald-700">
                      {Number(stockProduct.stock) + (Number(stockToAdd) || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">Quick:</span>
                  {[5, 10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStockToAdd((prev) => (prev ? Number(prev) + num : num))}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="e.g. Supplier delivery, Shipment received"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
                {/* Reason presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Supplier shipment', 'Restock from warehouse', 'Purchase order', 'Inventory audit'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setStockReason(r)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockSubmitting || !stockToAdd || Number(stockToAdd) <= 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 font-bold" />
                  <span>
                    {stockSubmitting
                      ? 'Updating...'
                      : `Add +${Number(stockToAdd) || 0} Units`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
