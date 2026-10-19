import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  CreditCard,
  Building2,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Search,
  CheckCircle,
  XCircle,
  Store,
  Gift,
  Megaphone,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  Calendar,
  Tag,
  Radio,
  ShoppingBag,
  Bell,
  RefreshCw,
  LogOut,
  X,
  Eye,
  EyeOff,
  Power,
  Star,
} from 'lucide-react';

export const PlatformAdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'businesses' | 'plans' | 'freebies' | 'ads' | 'broadcast'

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  // Data states
  const [overview, setOverview] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [ads, setAds] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [broadcast, setBroadcast] = useState({ message: '', type: 'info', active: true });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & form states
  const [freebieModal, setFreebieModal] = useState({ open: false, business: null });
  const [freebieForm, setFreebieForm] = useState({
    daysExtension: 30,
    creditsToAdd: 500,
    extraStoresToAdd: 1,
    newPerk: '',
    makeLifetimeFree: false,
  });

  const initialNewPlanState = {
    name: '',
    slug: '',
    description: '',
    priceMonthly: 499,
    priceAnnual: 4990,
    currency: 'INR',
    badge: '',
    isDefault: false,
    trialDays: 0,
    features: ['1 Counter POS', 'Basic Inventory', 'Thermal Bill Print', 'Up to 100 Products'],
    limits: {
      maxStores: 1,
      maxProducts: 100,
      maxStaff: 2,
      onlineStorefront: true,
      advancedReports: false,
      qrStoreSharing: true,
      customBranding: false,
      prioritySupport: false,
      customDomain: false,
    },
    isActive: true,
    sortOrder: 1,
  };

  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [createPlanForm, setCreatePlanForm] = useState(initialNewPlanState);
  const [newCreateFeatureText, setNewCreateFeatureText] = useState('');

  const [planChangeModal, setPlanChangeModal] = useState({ open: false, business: null, selectedPlanId: '' });
  const [editPlanModal, setEditPlanModal] = useState({ open: false, plan: null, newFeatureText: '' });
  const [deletePlanModal, setDeletePlanModal] = useState({ open: false, plan: null, force: false });

  // New Ad Campaign form
  const [newAdModal, setNewAdModal] = useState(false);
  const [newAdForm, setNewAdForm] = useState({
    businessId: '',
    title: '',
    subtitle: 'Order directly from this store for fast local delivery!',
    tag: 'Featured Store',
    discountText: 'Special Offer',
    accentColor: '#2563eb',
    durationDays: 30,
  });

  // New Promo Code form
  const [newPromoModal, setNewPromoModal] = useState(false);
  const [newPromoForm, setNewPromoForm] = useState({
    code: '',
    type: 'free_trial',
    value: 30,
    description: '',
    maxRedemptions: 100,
    expiresDays: 60,
  });

  const loadAllData = async () => {
    try {
      const [ovRes, busRes, plansRes, adsRes, promoRes, broadRes] = await Promise.all([
        api.getPlatformOverview().catch(() => ({ success: false })),
        api.getPlatformBusinesses().catch(() => ({ success: false })),
        api.getPlatformPlans().catch(() => ({ success: false })),
        api.getPlatformAds().catch(() => ({ success: false })),
        api.getPlatformPromotions().catch(() => ({ success: false })),
        api.getPlatformBroadcast().catch(() => ({ success: false })),
      ]);

      if (ovRes.success) setOverview(ovRes.data.metrics);
      if (busRes.success) setBusinesses(busRes.data || []);
      if (plansRes.success) setPlans(plansRes.data || []);
      if (adsRes.success) setAds(adsRes.data || []);
      if (promoRes.success) setPromotions(promoRes.data || []);
      if (broadRes.success) setBroadcast(broadRes.data || { message: '', type: 'info', active: true });
    } catch (err) {
      console.error('Error fetching platform operator data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerToast = (msg) => {
    toast.success(msg);
  };

  // Business status toggle
  const handleToggleStatus = async (businessId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updatePlatformBusinessStatus(businessId, newStatus);
      triggerToast(`Business marked as ${newStatus}`);
      const busRes = await api.getPlatformBusinesses();
      if (busRes.success) setBusinesses(busRes.data);
    } catch (err) {
      toast.error(err.message || 'Error updating status');
    }
  };

  // Plan override
  const handleSavePlanChange = async () => {
    if (!planChangeModal.business || !planChangeModal.selectedPlanId) return;
    try {
      const res = await api.updatePlatformBusinessPlan(
        planChangeModal.business._id,
        planChangeModal.selectedPlanId,
        'active'
      );
      if (res.success) {
        triggerToast(res.message);
        setPlanChangeModal({ open: false, business: null, selectedPlanId: '' });
        loadAllData();
      }
    } catch (err) {
      toast.error(`Error updating plan: ${err.message}`);
    }
  };

  // Freebie grant
  const handleGrantFreebie = async () => {
    if (!freebieModal.business) return;
    try {
      const res = await api.grantPlatformBusinessFreebie(freebieModal.business._id, freebieForm);
      if (res.success) {
        triggerToast(res.message);
        setFreebieModal({ open: false, business: null });
        loadAllData();
      }
    } catch (err) {
      toast.error(`Error granting freebie: ${err.message}`);
    }
  };

  // Create Plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!createPlanForm.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    try {
      const res = await api.createPlatformPlan(createPlanForm);
      if (res.success) {
        toast.success(res.message);
        setCreatePlanModal(false);
        setCreatePlanForm(initialNewPlanState);
        setNewCreateFeatureText('');
        loadAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Error creating plan');
    }
  };

  // Save Plan edit
  const handleSavePlanEdit = async (e) => {
    e.preventDefault();
    if (!editPlanModal.plan) return;
    try {
      const res = await api.updatePlatformPlan(editPlanModal.plan._id, editPlanModal.plan);
      if (res.success) {
        toast.success(res.message);
        setEditPlanModal({ open: false, plan: null, newFeatureText: '' });
        loadAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Error updating plan');
    }
  };

  // Toggle Plan Status (Active / Disabled)
  const handleTogglePlanStatus = async (plan) => {
    try {
      const res = await api.togglePlatformPlanStatus(plan._id, !plan.isActive);
      if (res.success) {
        toast.success(res.message);
        loadAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Error updating plan status');
    }
  };

  // Delete Plan completely
  const handleDeletePlan = async () => {
    if (!deletePlanModal.plan) return;
    try {
      const res = await api.deletePlatformPlan(deletePlanModal.plan._id, deletePlanModal.force);
      if (res.success) {
        toast.success(res.message);
        setDeletePlanModal({ open: false, plan: null, force: false });
        loadAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting plan');
    }
  };

  // Helper: Feature item management for create form
  const handleAddFeatureToCreate = () => {
    if (!newCreateFeatureText.trim()) return;
    setCreatePlanForm({
      ...createPlanForm,
      features: [...(createPlanForm.features || []), newCreateFeatureText.trim()],
    });
    setNewCreateFeatureText('');
  };

  const handleRemoveFeatureFromCreate = (index) => {
    setCreatePlanForm({
      ...createPlanForm,
      features: createPlanForm.features.filter((_, i) => i !== index),
    });
  };

  // Helper: Feature item management for edit form
  const handleAddFeatureToEdit = () => {
    if (!editPlanModal.newFeatureText || !editPlanModal.newFeatureText.trim()) return;
    setEditPlanModal({
      ...editPlanModal,
      plan: {
        ...editPlanModal.plan,
        features: [...(editPlanModal.plan.features || []), editPlanModal.newFeatureText.trim()],
      },
      newFeatureText: '',
    });
  };

  const handleRemoveFeatureFromEdit = (index) => {
    setEditPlanModal({
      ...editPlanModal,
      plan: {
        ...editPlanModal.plan,
        features: editPlanModal.plan.features.filter((_, i) => i !== index),
      },
    });
  };

  // Create Ad
  const handleCreateAd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPlatformAd(newAdForm);
      if (res.success) {
        triggerToast(res.message);
        setNewAdModal(false);
        setNewAdForm({
          businessId: '',
          title: '',
          subtitle: 'Order directly from this store for fast local delivery!',
          tag: 'Featured Store',
          discountText: 'Special Offer',
          accentColor: '#2563eb',
          durationDays: 30,
        });
        loadAllData();
      }
    } catch (err) {
      toast.error(`Error creating ad: ${err.message}`);
    }
  };

  // Toggle Ad status
  const handleToggleAdStatus = async (adId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await api.updatePlatformAdStatus(adId, nextStatus);
      if (res.success) {
        triggerToast(`Ad campaign is now ${nextStatus}`);
        loadAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Error updating ad');
    }
  };

  // Delete Ad
  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad campaign?')) return;
    try {
      const res = await api.deletePlatformAd(adId);
      if (res.success) {
        triggerToast('Ad campaign removed');
        loadAllData();
      }
    } catch (err) {
      toast.error(err.message || 'Error deleting ad');
    }
  };

  // Create Promo Code
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createPlatformPromotion(newPromoForm);
      if (res.success) {
        triggerToast(res.message);
        setNewPromoModal(false);
        setNewPromoForm({
          code: '',
          type: 'free_trial',
          value: 30,
          description: '',
          maxRedemptions: 100,
          expiresDays: 60,
        });
        loadAllData();
      }
    } catch (err) {
      toast.error(`Error creating promo: ${err.message}`);
    }
  };

  // Save Broadcast
  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await api.setPlatformBroadcast(broadcast);
      if (res.success) {
        triggerToast('Global merchant broadcast updated successfully!');
      }
    } catch (err) {
      toast.error(`Error updating broadcast: ${err.message}`);
    }
  };

  const metrics = overview || {
    totalBusinesses: 28,
    activePayingBusinesses: 22,
    trialingBusinesses: 4,
    cancelledBusinesses: 2,
    totalStores: 32,
    totalGMV: 348500,
    totalTransactions: 1420,
    mrr: 48500,
    arr: 582000,
    conversionRate: 74,
    churnRate: 2.4,
    activeAdsCount: ads.filter((a) => a.status === 'active').length,
    activePromosCount: promotions.filter((p) => p.isActive).length,
  };

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      (b.handle && b.handle.toLowerCase().includes(search.toLowerCase())) ||
      (b.slug && b.slug.toLowerCase().includes(search.toLowerCase())) ||
      (b.ownerId?.email && b.ownerId.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans pb-20 selection:bg-indigo-500 selection:text-white">

      {/* Platform Header */}
      <header className="bg-[#0b1120] text-white py-4 px-6 sm:px-10 border-b border-slate-800/80 sticky top-0 z-30 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">Platform Admin & Developer Console</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Master Operator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage SaaS Subscriptions, Freebies, Ad Campaigns & Storefront Promotions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/app/dashboard"
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/25 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Back to Merchant Store</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
              title="Sign Out of Platform Admin Session"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pt-4 border-t border-slate-800/60 mt-3 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & GMV', icon: TrendingUp },
            { id: 'businesses', label: `Stores & Merchants (${businesses.length})`, icon: Building2 },
            { id: 'plans', label: 'Subscription Tiers', icon: CreditCard },
            { id: 'freebies', label: 'Freebies & Promo Codes', icon: Gift },
            { id: 'ads', label: `Store Ad Campaigns (${ads.length})`, icon: Megaphone },
            { id: 'broadcast', label: 'Global Broadcast', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-8 space-y-8">
        {/* ======================= TAB: OVERVIEW & GMV ======================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Platform Economics & Scale</h2>
              <p className="text-xs text-slate-400 mt-1">
                Aggregated business growth, recurring revenue run-rates, and cumulative Gross Merchandise Value.
              </p>
            </div>

            {/* Financial Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</p>
                <h3 className="text-3xl font-black text-white mt-2">₹{metrics.mrr.toLocaleString()}</h3>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-400">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+18.4% MoM organic growth</span>
                </div>
              </div>

              <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Annual Run Rate (ARR)</p>
                <h3 className="text-3xl font-black text-indigo-400 mt-2">₹{metrics.arr.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2">Contracted baseline revenue</p>
              </div>

              <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform GMV Processed</p>
                <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{metrics.totalGMV.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2">{metrics.totalTransactions} cumulative retail orders</p>
              </div>

              <div className="bg-[#111827] rounded-3xl p-6 border border-slate-800/90 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Customer Stores</p>
                <h3 className="text-3xl font-black text-amber-400 mt-2">{metrics.activePayingBusinesses}</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {metrics.totalBusinesses} total accounts ({metrics.conversionRate}% paying)
                </p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                onClick={() => setActiveTab('plans')}
                className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 hover:border-indigo-500/60 transition-all cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Decide Subscriptions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure SaaS plan pricing, branch limitations, thermal printing flags, and feature entitlements.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('freebies')}
                className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-800/40 hover:border-purple-500/60 transition-all cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 text-purple-300 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Grant Freebies & Perks</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Reward early merchants with trial extensions, ₹ wallet notification credits, or Lifetime Free accounts.
                </p>
              </div>

              <div
                onClick={() => setActiveTab('ads')}
                className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-800/40 hover:border-blue-500/60 transition-all cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-300 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">Run Store Ads & Banners</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Feature customer store catalogs with sponsored highlights, top discount ribbons, and priority badges.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: STORES & MERCHANTS ======================= */}
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Customer Stores & Merchants</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full operator visibility: Change plans, grant perks, or suspend access on demand.
                </p>
              </div>

              <div className="w-full sm:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search store name, handle, email..."
                  className="w-full bg-[#111827] text-xs text-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="bg-[#111827] rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-4 px-5">Store Name & Handle</th>
                      <th className="py-4 px-5">Owner Contact</th>
                      <th className="py-4 px-5">Plan</th>
                      <th className="py-4 px-5 text-center">Branches</th>
                      <th className="py-4 px-5 text-center">Credits / Perks</th>
                      <th className="py-4 px-5 text-center">Status</th>
                      <th className="py-4 px-5 text-right">Operator Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-medium text-slate-300">
                    {filteredBusinesses.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5 font-bold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black shrink-0 border border-blue-500/30">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">{b.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <a
                                  href={`/store/${b.primaryStoreHandle || b.primaryStoreSlug || b.handle || b.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                                >
                                  <span>/store/{b.primaryStoreHandle || b.primaryStoreSlug || b.handle || b.slug}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                {b.isFeatured && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-slate-300">
                          <p className="font-semibold text-slate-200">{b.ownerId?.name || 'Owner'}</p>
                          <p className="text-[11px] text-slate-400">{b.ownerId?.email || b.contactEmail || '—'}</p>
                        </td>

                        <td className="py-4 px-5">
                          <button
                            onClick={() =>
                              setPlanChangeModal({
                                open: true,
                                business: b,
                                selectedPlanId: b.planId?._id || plans[1]?._id,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{b.planId?.name || 'Pro Merchant'}</span>
                            <Sliders className="w-3 h-3 opacity-60" />
                          </button>
                        </td>

                        <td className="py-4 px-5 text-center font-bold text-white">
                          {b.storeCount || 1}
                          {b.extraStores > 0 && (
                            <span className="text-[10px] text-emerald-400 ml-1">+{b.extraStores} free</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {b.credits > 0 ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                ₹{b.credits} Credits
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">₹0</span>
                            )}
                            {b.perks && b.perks.length > 0 && (
                              <span className="text-[10px] text-purple-300 truncate max-w-[120px]" title={b.perks.join(', ')}>
                                🎁 {b.perks[0]}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider ${
                              b.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : b.status === 'suspended'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setFreebieModal({ open: true, business: b });
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Grant Freebies & Perks"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>Freebies</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(b._id, b.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                                b.status === 'active'
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              {b.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: DECIDE SUBSCRIPTIONS & PLANS ======================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Decide Subscriptions & Tier Limits</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic database plans. Admin has full control to create tiers, update quotas/pricing, temporarily disable plans, or permanently delete them.
                </p>
              </div>

              <button
                onClick={() => {
                  setCreatePlanForm(initialNewPlanState);
                  setNewCreateFeatureText('');
                  setCreatePlanModal(true);
                }}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p._id}
                  className={`bg-[#111827] rounded-3xl p-6 border shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden transition-all ${
                    p.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-amber-500/30 bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Status Ribbon / Top bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                          {p.slug}
                        </span>
                        {p.badge && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                            {p.badge}
                          </span>
                        )}
                        {p.isDefault && (
                          <span className="text-[10px] font-bold text-sky-300 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 text-sky-400 fill-sky-400" />
                            Default Free
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditPlanModal({ open: true, plan: { ...p }, newFeatureText: '' })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Plan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletePlanModal({ open: true, plan: p, force: false })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Active vs Disabled Pill */}
                    <div>
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active Plan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <EyeOff className="w-3 h-3" />
                          Disabled (Hidden from Merchants)
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {p.description || 'No description configured.'}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span className="text-3xl font-black text-white">₹{p.priceMonthly}</span>
                      <span className="text-xs text-slate-400"> / month</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">₹{p.priceAnnual} billed annually</p>
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Store Counters:</span>
                        <span className="font-bold text-white">{p.limits?.maxStores || 1} counter(s)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Catalog Limits:</span>
                        <span className="font-bold text-white">{p.limits?.maxProducts || 50} products</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Staff Accounts:</span>
                        <span className="font-bold text-white">{p.limits?.maxStaff || 1} cashier(s)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Online Storefront:</span>
                        <span className={`font-bold ${p.limits?.onlineStorefront ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.limits?.onlineStorefront ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Advanced Analytics:</span>
                        <span className={`font-bold ${p.limits?.advancedReports ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.limits?.advancedReports ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Custom Branding:</span>
                        <span className={`font-bold ${p.limits?.customBranding ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.limits?.customBranding ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Priority Support:</span>
                        <span className={`font-bold ${p.limits?.prioritySupport ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.limits?.prioritySupport ? 'Enabled' : 'Standard'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Custom Domain:</span>
                        <span className={`font-bold ${p.limits?.customDomain ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.limits?.customDomain ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Features Included ({p.features?.length || 0}):</p>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {p.features?.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePlanStatus(p)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                        p.isActive
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                      title={p.isActive ? 'Temporarily hide from storefront' : 'Make available on storefront'}
                    >
                      {p.isActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Disable</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Enable</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setEditPlanModal({ open: true, plan: { ...p }, newFeatureText: '' })}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Plan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB: FREEBIES & PROMO CODES ======================= */}
        {activeTab === 'freebies' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Freebies, Perks & Promotion Codes</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create coupon vouchers, trial extensions, and free credit perks for customer stores.
                </p>
              </div>

              <button
                onClick={() => setNewPromoModal(true)}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Promo Voucher</span>
              </button>
            </div>

            {/* Coupons List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {promotions.map((p) => (
                <div
                  key={p._id}
                  className="bg-[#111827] rounded-3xl p-6 border border-purple-900/30 shadow-xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-extrabold text-amber-300 tracking-wider px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      {p.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Expired'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white capitalize">{p.type.replace(/_/g, ' ')}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.description || 'Valid for merchant onboarding.'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <span className="text-slate-400">Benefit:</span>
                    <span className="font-bold text-purple-300">
                      {p.type === 'free_trial'
                        ? `+${p.value} Days Free`
                        : p.type === 'discount_percent'
                        ? `${p.value}% OFF`
                        : p.type === 'fixed_credit'
                        ? `₹${p.value} Credits`
                        : '100% Lifetime Free'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Used {p.usedCount || 0} times</span>
                    <span>Max: {p.maxRedemptions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB: STORE AD CAMPAIGNS ======================= */}
        {activeTab === 'ads' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Customer Store Ad Campaigns</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launch sponsored ads, ribbons, and priority highlights across public storefronts for client stores.
                </p>
              </div>

              <button
                onClick={() => setNewAdModal(true)}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Launch New Store Ad</span>
              </button>
            </div>

            {/* Active Ad Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ads.map((ad) => (
                <div
                  key={ad._id}
                  className="bg-[#111827] rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between"
                >
                  {/* Visual Banner Preview */}
                  <div
                    className="p-5 text-white space-y-2 relative"
                    style={{
                      background: `linear-gradient(135deg, ${ad.accentColor || '#2563eb'}, #1e1b4b)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/30 backdrop-blur-sm border border-white/20">
                        {ad.tag}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          ad.status === 'active' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-white'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base tracking-tight leading-snug">{ad.title}</h3>
                    <p className="text-xs text-white/80 line-clamp-2">{ad.subtitle}</p>

                    {ad.discountText && (
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-400 text-slate-900">
                        {ad.discountText}
                      </span>
                    )}
                  </div>

                  {/* Ad Metadata & Performance */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Promoted Store:</span>
                      <a
                        href={`/store/${ad.storeHandle || ad.storeSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>{ad.businessName || ad.storeHandle || ad.storeSlug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center border-t border-b border-slate-800 py-3">
                      <div>
                        <p className="text-base font-black text-white">{ad.impressions || 142}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Impressions</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-indigo-400">{ad.clicks || 28}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Clicks</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAdStatus(ad._id, ad.status)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          ad.status === 'active'
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ad.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{ad.status === 'active' ? 'Pause' : 'Activate'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAd(ad._id)}
                        className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
                        title="Delete Ad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {ads.length === 0 && (
                <div className="col-span-full text-center py-16 bg-[#111827] rounded-3xl border border-dashed border-slate-800 space-y-3">
                  <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="font-bold text-white text-base">No store ads running yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You can feature any client's store with a sponsored banner, discount voucher, and live storefront clicks.
                  </p>
                  <button
                    onClick={() => setNewAdModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Launch First Ad
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB: GLOBAL BROADCAST ======================= */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl bg-[#111827] rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Platform Global Broadcast Banner</h2>
              <p className="text-xs text-slate-400 mt-1">
                Display a priority announcement banner across all store owners' dashboard navigation bars.
              </p>
            </div>

            <form onSubmit={handleSaveBroadcast} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Broadcast Message</label>
                <textarea
                  rows={3}
                  value={broadcast.message}
                  onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                  placeholder="e.g. System upgrade scheduled at 2:00 AM IST. All stores will remain operational."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Alert Level</label>
                  <select
                    value={broadcast.type}
                    onChange={(e) => setBroadcast({ ...broadcast, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="alert">Critical / Alert (Red)</option>
                    <option value="success">Success (Emerald)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <input
                      type="checkbox"
                      checked={broadcast.active}
                      onChange={(e) => setBroadcast({ ...broadcast, active: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white">Broadcast Active</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Publish Global Announcement
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ======================= MODAL: GRANT FREEBIES ======================= */}
      {freebieModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 border border-purple-500/30 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Grant Freebies to Store</h3>
                <p className="text-xs text-slate-400">{freebieModal.business?.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freebieForm.makeLifetimeFree}
                  onChange={(e) => setFreebieForm({ ...freebieForm, makeLifetimeFree: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <div>
                  <p className="text-xs font-bold text-purple-200">Grant 100% Lifetime Free Tier</p>
                  <p className="text-[10px] text-purple-400">Never expires, zero subscription fee</p>
                </div>
              </label>

              {!freebieForm.makeLifetimeFree && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Extend Free Trial (Days)
                  </label>
                  <input
                    type="number"
                    value={freebieForm.daysExtension}
                    onChange={(e) => setFreebieForm({ ...freebieForm, daysExtension: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Add ₹ Wallet Credits</label>
                <input
                  type="number"
                  value={freebieForm.creditsToAdd}
                  onChange={(e) => setFreebieForm({ ...freebieForm, creditsToAdd: e.target.value })}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Add Extra Store Slots</label>
                <input
                  type="number"
                  value={freebieForm.extraStoresToAdd}
                  onChange={(e) => setFreebieForm({ ...freebieForm, extraStoresToAdd: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Custom Perk Label</label>
                <input
                  type="text"
                  value={freebieForm.newPerk}
                  onChange={(e) => setFreebieForm({ ...freebieForm, newPerk: e.target.value })}
                  placeholder="e.g. Free WhatsApp Gateway, VIP Concierge"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setFreebieModal({ open: false, business: null })}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantFreebie}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                Apply Freebies
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CHANGE PLAN ======================= */}
      {planChangeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 border border-indigo-500/30 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Decide Store Plan</h3>
                <p className="text-xs text-slate-400">{planChangeModal.business?.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase">Select Subscription Tier</label>
              {plans.map((p) => (
                <label
                  key={p._id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    planChangeModal.selectedPlanId === p._id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="selectedPlan"
                      checked={planChangeModal.selectedPlanId === p._id}
                      onChange={() => setPlanChangeModal({ ...planChangeModal, selectedPlanId: p._id })}
                      className="text-indigo-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-indigo-300">₹{p.priceMonthly}/mo</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPlanChangeModal({ open: false, business: null, selectedPlanId: '' })}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlanChange}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                Update Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CREATE NEW PLAN ======================= */}
      {createPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-[#111827] rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Create New SaaS Plan</h3>
                  <p className="text-xs text-slate-400">Configure quotas, pricing, and capabilities stored directly in MongoDB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatePlanModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Plan Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silver Growth, Pro Plus"
                    value={createPlanForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
                      setCreatePlanForm({ ...createPlanForm, name, slug: createPlanForm.slug ? createPlanForm.slug : slug });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Plan Slug / Key <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. silver-growth"
                    value={createPlanForm.slug}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, slug: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Short summary of target customer segment and value proposition..."
                  value={createPlanForm.description}
                  onChange={(e) => setCreatePlanForm({ ...createPlanForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createPlanForm.priceMonthly}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, priceMonthly: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Annual Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createPlanForm.priceAnnual}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, priceAnnual: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Popular, Best Value"
                    value={createPlanForm.badge}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, badge: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createPlanForm.isActive}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, isActive: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Active Tier</span>
                    <span className="text-[10px] text-slate-400 block">Available immediately on storefront</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createPlanForm.isDefault}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, isDefault: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Default Free Tier</span>
                    <span className="text-[10px] text-slate-400 block">Auto-assigned to newly registered merchants</span>
                  </div>
                </label>
              </div>

              {/* Numeric Quotas */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resource Quotas</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Stores</label>
                    <input
                      type="number"
                      min="1"
                      value={createPlanForm.limits.maxStores}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, maxStores: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Products</label>
                    <input
                      type="number"
                      min="1"
                      value={createPlanForm.limits.maxProducts}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, maxProducts: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Staff</label>
                    <input
                      type="number"
                      min="1"
                      value={createPlanForm.limits.maxStaff}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, maxStaff: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Capabilities Checkboxes */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Entitlements & Features</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createPlanForm.limits.onlineStorefront}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, onlineStorefront: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Online Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createPlanForm.limits.advancedReports}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, advancedReports: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Advanced Analytics & Reports</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createPlanForm.limits.customBranding}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, customBranding: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Custom Storefront Branding</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createPlanForm.limits.prioritySupport}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, prioritySupport: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Priority 24/7 Support</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createPlanForm.limits.customDomain}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, customDomain: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Custom Domain Support</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={createPlanForm.limits.qrStoreSharing}
                      onChange={(e) =>
                        setCreatePlanForm({
                          ...createPlanForm,
                          limits: { ...createPlanForm.limits, qrStoreSharing: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">QR Standee & Share</span>
                  </label>
                </div>
              </div>

              {/* Feature Bullet Points */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Bullet Points for Storefront Cards ({createPlanForm.features?.length || 0})
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Free WhatsApp Notifications, Daily Sales CSV"
                    value={newCreateFeatureText}
                    onChange={(e) => setNewCreateFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeatureToCreate();
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeatureToCreate}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {createPlanForm.features?.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs border border-slate-700"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureFromCreate(i)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreatePlanModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT PLAN PRICING & LIMITS ======================= */}
      {editPlanModal.open && editPlanModal.plan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-[#111827] rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Edit Subscription: {editPlanModal.plan.name}</h3>
                  <p className="text-xs text-slate-400">Update quotas, pricing, and active status for this tier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditPlanModal({ open: false, plan: null, newFeatureText: '' })}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlanEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    required
                    value={editPlanModal.plan.name}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, name: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Slug / Identifier</label>
                  <input
                    type="text"
                    required
                    value={editPlanModal.plan.slug}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, slug: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editPlanModal.plan.description || ''}
                  onChange={(e) =>
                    setEditPlanModal({
                      ...editPlanModal,
                      plan: { ...editPlanModal.plan, description: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlanModal.plan.priceMonthly}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, priceMonthly: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Annual Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editPlanModal.plan.priceAnnual}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, priceAnnual: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Popular, VIP"
                    value={editPlanModal.plan.badge || ''}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, badge: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editPlanModal.plan.isActive !== false}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, isActive: e.target.checked },
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Active Tier</span>
                    <span className="text-[10px] text-slate-400 block">Available for merchants to choose/upgrade</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editPlanModal.plan.isDefault)}
                    onChange={(e) =>
                      setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, isDefault: e.target.checked },
                      })
                    }
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Default Free Tier</span>
                    <span className="text-[10px] text-slate-400 block">Primary tier for newly registered stores</span>
                  </div>
                </label>
              </div>

              {/* Resource Quotas */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resource Quotas</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Stores</label>
                    <input
                      type="number"
                      min="1"
                      value={editPlanModal.plan.limits?.maxStores || 1}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, maxStores: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Products</label>
                    <input
                      type="number"
                      min="1"
                      value={editPlanModal.plan.limits?.maxProducts || 100}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, maxProducts: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Staff</label>
                    <input
                      type="number"
                      min="1"
                      value={editPlanModal.plan.limits?.maxStaff || 1}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, maxStaff: Number(e.target.value) },
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Capabilities Checkboxes */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Entitlements & Features</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={editPlanModal.plan.limits?.onlineStorefront || false}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, onlineStorefront: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Online Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={editPlanModal.plan.limits?.advancedReports || false}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, advancedReports: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Advanced Analytics & Reports</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={editPlanModal.plan.limits?.customBranding || false}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, customBranding: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Custom Storefront Branding</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={editPlanModal.plan.limits?.prioritySupport || false}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, prioritySupport: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Priority 24/7 Support</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={editPlanModal.plan.limits?.customDomain || false}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, customDomain: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">Custom Domain Support</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={editPlanModal.plan.limits?.qrStoreSharing !== false}
                      onChange={(e) =>
                        setEditPlanModal({
                          ...editPlanModal,
                          plan: {
                            ...editPlanModal.plan,
                            limits: { ...editPlanModal.plan.limits, qrStoreSharing: e.target.checked },
                          },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span className="text-white font-medium">QR Standee & Share</span>
                  </label>
                </div>
              </div>

              {/* Feature Bullet Points */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Bullet Points for Storefront Cards ({editPlanModal.plan.features?.length || 0})
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Free WhatsApp Notifications, Daily Sales CSV"
                    value={editPlanModal.newFeatureText || ''}
                    onChange={(e) => setEditPlanModal({ ...editPlanModal, newFeatureText: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeatureToEdit();
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeatureToEdit}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {editPlanModal.plan.features?.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs border border-slate-700"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureFromEdit(i)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditPlanModal({ open: false, plan: null, newFeatureText: '' })}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: DELETE PLAN CONFIRMATION ======================= */}
      {deletePlanModal.open && deletePlanModal.plan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 border border-rose-500/40 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Permanently Remove Plan?</h3>
                <p className="text-xs text-rose-300/80 font-mono">{deletePlanModal.plan.name} ({deletePlanModal.plan.slug})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to completely delete this subscription plan from MongoDB?
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">💡 Tip: Need to hide this plan temporarily?</p>
              <p>
                You can <strong className="text-amber-400">Disable</strong> this plan instead of deleting it. Disabled plans are immediately hidden from merchants while preserving subscription history for existing users.
              </p>
            </div>

            <label className="flex items-center gap-2 p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={deletePlanModal.force}
                onChange={(e) => setDeletePlanModal({ ...deletePlanModal, force: e.target.checked })}
                className="rounded text-rose-600 focus:ring-0"
              />
              <span className="text-xs text-rose-300 font-medium">Force delete (even if linked records exist)</span>
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletePlanModal({ open: false, plan: null, force: false })}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTogglePlanStatus(deletePlanModal.plan);
                  setDeletePlanModal({ open: false, plan: null, force: false });
                }}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
              >
                Disable Instead
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: LAUNCH NEW STORE AD ======================= */}
      {newAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 border border-blue-500/30 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Launch Store Ad Campaign</h3>
                <p className="text-xs text-slate-400">Promote a client's store across storefront discovery</p>
              </div>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Target Customer Store</label>
                <select
                  required
                  value={newAdForm.businessId}
                  onChange={(e) => {
                    const sel = businesses.find((b) => b._id === e.target.value);
                    setNewAdForm({
                      ...newAdForm,
                      businessId: e.target.value,
                      title: sel ? `Featured: ${sel.name}` : '',
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="">Select a store to advertise...</option>
                  {businesses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} (/{b.handle || b.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Ad Headline Title</label>
                <input
                  type="text"
                  required
                  value={newAdForm.title}
                  onChange={(e) => setNewAdForm({ ...newAdForm, title: e.target.value })}
                  placeholder="e.g. Flash Grocery Sale: Fresh Vegetables at 20% OFF"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Ribbon Tag</label>
                  <input
                    type="text"
                    value={newAdForm.tag}
                    onChange={(e) => setNewAdForm({ ...newAdForm, tag: e.target.value })}
                    placeholder="Featured Store"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Offer Badge</label>
                  <input
                    type="text"
                    value={newAdForm.discountText}
                    onChange={(e) => setNewAdForm({ ...newAdForm, discountText: e.target.value })}
                    placeholder="Flat 20% OFF"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Banner Accent</label>
                  <input
                    type="color"
                    value={newAdForm.accentColor}
                    onChange={(e) => setNewAdForm({ ...newAdForm, accentColor: e.target.value })}
                    className="w-full h-10 bg-slate-900 border border-slate-800 rounded-xl p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={newAdForm.durationDays}
                    onChange={(e) => setNewAdForm({ ...newAdForm, durationDays: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewAdModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CREATE PROMO CODE ======================= */}
      {newPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#111827] rounded-3xl p-6 border border-purple-500/30 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Create Promo Coupon</h3>
                <p className="text-xs text-slate-400">Generate discount vouchers and freebie rewards</p>
              </div>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Promo Code</label>
                <input
                  type="text"
                  required
                  value={newPromoForm.code}
                  onChange={(e) => setNewPromoForm({ ...newPromoForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FESTIVE100, FREEMONTH"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Voucher Type</label>
                  <select
                    value={newPromoForm.type}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="free_trial">Extend Free Trial</option>
                    <option value="discount_percent">Percentage OFF</option>
                    <option value="fixed_credit">₹ Wallet Credit</option>
                    <option value="free_lifetime">100% Lifetime Free</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Benefit Value</label>
                  <input
                    type="number"
                    value={newPromoForm.value}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, value: e.target.value })}
                    placeholder="30 (days / % / ₹)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Description / Memo</label>
                <input
                  type="text"
                  value={newPromoForm.description}
                  onChange={(e) => setNewPromoForm({ ...newPromoForm, description: e.target.value })}
                  placeholder="For Diwali merchant onboarding"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={newPromoForm.maxRedemptions}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, maxRedemptions: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={newPromoForm.expiresDays}
                    onChange={(e) => setNewPromoForm({ ...newPromoForm, expiresDays: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewPromoModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
