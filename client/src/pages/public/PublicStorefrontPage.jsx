import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Store,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const PublicStorefrontPage = () => {
  const { storeSlug } = useParams();
  const [products, setProducts] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchStoreCatalog = async () => {
      setLoading(true);
      try {
        // Fallback demo products matching screenshot if public route
        const mockCatalog = [
          {
            _id: 'prod-maggi',
            name: 'Maggi Noodles',
            brand: 'Nestle',
            category: 'Snacks',
            sellingPrice: 12,
            stock: 50,
            image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-coke',
            name: 'Coca Cola',
            brand: 'Coca Cola',
            category: 'Beverages',
            sellingPrice: 40,
            stock: 30,
            image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-lays',
            name: 'Lays Classic',
            brand: 'Lays',
            category: 'Snacks',
            sellingPrice: 20,
            stock: 25,
            image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-milk',
            name: 'Amul Milk',
            brand: 'Amul',
            category: 'Dairy',
            sellingPrice: 28,
            stock: 12,
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-parleg',
            name: 'Parle-G',
            brand: 'Parle',
            category: 'Biscuits',
            sellingPrice: 10,
            stock: 100,
            image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-bread',
            name: 'Britannia Bread',
            brand: 'Britannia',
            category: 'Bakery',
            sellingPrice: 35,
            stock: 5,
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-sprite',
            name: 'Sprite',
            brand: 'Coca Cola',
            category: 'Beverages',
            sellingPrice: 40,
            stock: 45,
            image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=300&q=80',
          },
          {
            _id: 'prod-dairymilk',
            name: 'Dairy Milk',
            brand: 'Cadbury',
            category: 'Chocolates',
            sellingPrice: 60,
            stock: 8,
            image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=300&q=80',
          },
        ];

        setProducts(mockCatalog);
        const cats = Array.from(new Set(mockCatalog.map((p) => p.category)));
        setCategories(['All', ...cats]);
        setStoreInfo({
          name: 'Apex Supermarket',
          address: '123 Market Street, Indiranagar, Bangalore',
          phone: '+91 9876543210',
          openHours: 'Open Today: 8:00 AM – 10:00 PM',
        });
      } catch (err) {
        console.error('Failed to load store:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreCatalog();
  }, [storeSlug]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.sellingPrice,
          image: product.image,
          quantity: 1,
        },
      ];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCharges = cartSubtotal > 500 ? 0 : 30;
  const cartTotal = cartSubtotal + (cartSubtotal > 0 ? deliveryCharges : 0);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          deliveryAddress,
        },
        items: cart,
        paymentMethod,
      };

      const res = await api.createPublicOrder(storeSlug || 'apex-indiranagar', payload);
      if (res.success) {
        setOrderConfirmed(res.data);
        setCart([]);
        setCheckoutOpen(false);
      }
    } catch (err) {
      alert(`Order placement error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">
                {storeInfo?.name || 'Apex Supermarket'}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Indiranagar, Bangalore</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartItems > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Storefront Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-8 text-white shadow-xl shadow-blue-600/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-blue-100">
              Instant Online Delivery
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Fresh Groceries & Daily Essentials
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-md">
              Order directly from our local store shelf. Delivered straight to your doorstep in 30 minutes!
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>Open Today: 8:00 AM – 10:00 PM</span>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-white text-xs text-slate-800 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 mb-3 relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                    {p.brand}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{p.category}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-3">
                <span className="text-base font-extrabold text-slate-900">₹{p.sellingPrice}</span>
                <button
                  onClick={() => addToCart(p)}
                  className="flex items-center gap-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">Your Cart ({totalCartItems})</h3>
                </div>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-[55vh] overflow-y-auto mt-4 pr-1">
                {cart.map((item) => (
                  <div key={item.productId} className="py-3 flex items-center justify-between gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[11px] font-semibold text-blue-600 mt-0.5">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-100 text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Your cart is currently empty.
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800">₹{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Charges</span>
                    <span className="font-bold text-slate-800">{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total Amount</span>
                    <span className="text-blue-600 text-xl">₹{cartTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Delivery Details</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Mehta"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Address *</label>
                <textarea
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House/Flat No, Apartment, Street, City"
                  rows="2"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Cash">Cash on Delivery</option>
                  <option value="Card">Credit / Debit Card</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">Total payable</p>
                  <p className="text-lg font-extrabold text-blue-600">₹{cartTotal}</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {submitting ? 'Placing Order...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmed Celebration Dialog */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-500">
              Your order <span className="font-bold text-slate-900">{orderConfirmed.orderNumber}</span> has been received by{' '}
              {storeInfo?.name || 'Apex Supermarket'}.
            </p>

            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-slate-100 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-900">₹{orderConfirmed.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold text-slate-900">{orderConfirmed.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">Pending Preparation</span>
              </div>
            </div>

            <button
              onClick={() => setOrderConfirmed(null)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
