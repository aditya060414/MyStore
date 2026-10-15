import React from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ArrowRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Receipt,
  Boxes,
  TrendingUp,
  CheckCircle2,
  QrCode,
  Users,
  ChevronRight,
  Layers,
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Store className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">MyStore</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pos" className="hover:text-blue-600 transition-colors">POS Billing</a>
            <a href="#storefront" className="hover:text-blue-600 transition-colors">Online Store</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-sm">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Multi-Tenant Retail Management Cloud Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Manage Inventory, POS Bills & Online Orders in{' '}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            One Unified SaaS
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium">
          Built for modern independent retail shops, supermarkets, and convenience stores. Complete tenant isolation,
          instant POS billing, online ordering storefront, and gross profit accounting.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/signin"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-sm transition-all"
          >
            View Live Merchant App
          </Link>
        </div>

        {/* 1-Click Test Credentials Highlight Bar */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">🚀 Instant One-Click Demo Access Available</p>
              <p className="text-[11px] text-slate-500">
                Preloaded with 10+ products (Maggi, Coke, Lays, Amul Milk) matching reference designs!
              </p>
            </div>
            <Link
              to="/signin"
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl shrink-0 transition-colors"
            >
              Try Demo Accounts →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Everything Your Retail Business Needs</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            From checkout counters to public customer ordering, MyStore gives you the tools to operate like a modern retail giant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Instant POS Billing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Barcode scanner support, fast item selection, multi-mode payment (Cash, Card, UPI), and live A4 or thermal receipt generation.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Stock & Inventory Alerts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time stock deduction, atomic concurrency checks, low-stock threshold triggers, and expiry date warnings within 15 days.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Public Storefront & QR</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Give customers a dedicated online ordering link with downloadable high-res QR codes and instant doorstep order notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Predictable, Transparent SaaS Pricing</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Choose the plan that suits your store size. Upgrade or downgrade anytime with no long-term lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Free Plan */}
          <div className="rounded-3xl p-8 border border-slate-200 bg-[#f8fafc] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Free Tier</h3>
              <p className="text-xs text-slate-500">For small popups, street vendors, and single-person kiosks.</p>
              <div className="pt-2">
                <span className="text-4xl font-extrabold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 1 Store Location</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 50 Products</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Basic POS Billing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Standard Thermal Receipts</li>
              </ul>
            </div>
            <Link
              to="/signup"
              className="w-full py-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-white text-center transition-colors block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="rounded-3xl p-8 border-2 border-blue-600 bg-white shadow-xl shadow-blue-500/10 flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Pro Retailer</h3>
              <p className="text-xs text-slate-500">For established retail shops wanting online orders & inventory automation.</p>
              <div className="pt-2">
                <span className="text-4xl font-extrabold text-blue-600">₹999</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> 1 Store Location</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Up to 500 Products</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Online Storefront & Orders</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> QR Code Store Sharing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> Gross Profit & COGS Reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> 5 Staff Accounts & RBAC</li>
              </ul>
            </div>
            <Link
              to="/signup"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 text-center transition-colors block"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Business Plan */}
          <div className="rounded-3xl p-8 border border-slate-200 bg-[#f8fafc] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Business Chain</h3>
              <p className="text-xs text-slate-500">For multi-branch supermarket chains and wholesale businesses.</p>
              <div className="pt-2">
                <span className="text-4xl font-extrabold text-slate-900">₹2,499</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 pt-4">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 5 Store Branches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 5,000 Products</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 20 Staff Accounts with RBAC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated Account Manager</li>
              </ul>
            </div>
            <Link
              to="/signup"
              className="w-full py-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-white text-center transition-colors block"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 py-12 px-6 max-w-7xl mx-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900">MyStore SaaS</span>
          <span>© 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/signin" className="hover:text-blue-600">Merchant Login</Link>
          <Link to="/platform" className="hover:text-blue-600">Platform Admin</Link>
        </div>
      </footer>
    </div>
  );
};
