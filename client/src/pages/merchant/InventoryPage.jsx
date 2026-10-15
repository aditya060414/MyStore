import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Package,
  Boxes,
  Tag,
  Calendar,
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ScanLine,
} from 'lucide-react';

export const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 124,
    lowStockItems: 8,
    categoriesCount: 12,
    expiringSoonCount: 6,
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
    barcode: '',
    expiryDate: '',
    image: '',
  });

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
  }, [search, category, brand, stockStatus, page]);

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
        barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        expiryDate: '',
        image: '',
      });
    }
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
      } else {
        await api.createProduct(formData);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(id);
        fetchProducts();
      } catch (err) {
        alert(err.message);
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStockBadge(p.stock)}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3 px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {products.length} of {stats.totalItems} items</span>
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
    </div>
  );
};
