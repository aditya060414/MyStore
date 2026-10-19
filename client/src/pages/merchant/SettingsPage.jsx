import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Building2,
  Receipt,
  Users,
  CreditCard,
  Save,
  Plus,
  Shield,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles,
  LogOut,
  KeyRound,
  Smartphone,
} from 'lucide-react';

export const SettingsPage = () => {
  const { activeBusiness, setActiveBusiness, activeTenant, setActiveTenant, user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const currentBusiness = activeBusiness || activeTenant;
  const [activeTab, setActiveTab] = useState('branding');

  // Business Branding & Settings state
  const [formData, setFormData] = useState({
    businessName: '',
    contactPhone: '',
    contactEmail: '',
    taxRate: 0,
    taxName: 'GST',
    invoicePrefix: 'INV-',
    billFormat: 'A4 - Standard',
    receiptFooter: 'Thank you for shopping with us! Visit again | BisonMooves Store',
  });

  // Team state
  const [staffList, setStaffList] = useState([]);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role: 'cashier' });

  // Subscription & real-time quota state
  const [plans, setPlans] = useState([]);
  const [subData, setSubData] = useState(null);
  const [productCount, setProductCount] = useState(0);
  const [storesCount, setStoresCount] = useState(1);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      setFormData({
        businessName: currentBusiness.name || '',
        contactPhone: currentBusiness.contactPhone || '',
        contactEmail: currentBusiness.contactEmail || '',
        taxRate: currentBusiness.settings?.taxRate || 0,
        taxName: currentBusiness.settings?.taxName || 'GST',
        invoicePrefix: currentBusiness.settings?.invoicePrefix || 'INV-',
        billFormat: currentBusiness.settings?.billFormat || 'A4 - Standard',
        receiptFooter: currentBusiness.settings?.receiptFooter || 'Thank you for shopping with us! Visit again | BisonMooves Store',
      });
    }

    const loadData = async () => {
      try {
        const staffRes = await api.getStaff();
        if (staffRes.success) setStaffList(staffRes.data || []);

        const plansRes = await api.getPlans();
        if (plansRes.success) setPlans(plansRes.data || []);

        const subRes = await api.getCurrentSubscription();
        if (subRes.success && subRes.data) {
          setSubData(subRes.data);
          if (subRes.data.usage) {
            setProductCount(subRes.data.usage.productsCount ?? 0);
            setStoresCount(subRes.data.usage.storesCount ?? 1);
          }
        }

        // Live inventory products count
        const prodRes = await api.getProducts({ limit: 1 });
        if (prodRes.success && prodRes.data?.stats) {
          setProductCount(prodRes.data.stats.totalItems ?? 0);
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      }
    };
    loadData();
  }, [currentBusiness]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.businessName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        settings: {
          taxRate: Number(formData.taxRate),
          taxName: formData.taxName,
          invoicePrefix: formData.invoicePrefix,
          billFormat: formData.billFormat,
          receiptFooter: formData.receiptFooter,
        },
      };
      const res = await api.updateSettings(payload);
      if (res.success) {
        if (setActiveBusiness) setActiveBusiness(res.data);
        if (setActiveTenant) setActiveTenant(res.data);
        toast.success('Store settings saved successfully!');
      }
    } catch (err) {
      toast.error(`Error saving settings: ${err.message}`);
    }
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addStaff(newStaff);
      if (res.success) {
        setStaffModalOpen(false);
        const staffRes = await api.getStaff();
        if (staffRes.success) setStaffList(staffRes.data);
        toast.success('Staff member invited successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Error adding staff');
    }
  };

  const handleUpgradePlan = async (planId) => {
    if (window.confirm('Confirm upgrade to this subscription plan?')) {
      try {
        const res = await api.upgradePlan(planId, 'monthly');
        if (res.success) {
          toast.success('Subscription plan upgraded successfully!');
          window.location.reload();
        }
      } catch (err) {
        toast.error(err.message || 'Error updating subscription');
      }
    }
  };

  const handleLogoutThisDevice = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  const handleLogoutAllDevices = async () => {
    if (window.confirm('Are you sure you want to log out of all devices? All active tokens and sessions will be revoked from Redis.')) {
      await logoutAll();
      navigate('/signin', { replace: true });
    }
  };

  const currentPlan =
    subData?.plan ||
    subData?.subscription?.planId ||
    currentBusiness?.planId ||
    plans.find((p) => p.slug === 'free') ||
    plans[0] ||
    {};

  const isFreePlan =
    currentPlan.priceMonthly === 0 ||
    currentPlan.slug === 'free' ||
    (currentPlan.name && currentPlan.name.toLowerCase().includes('free'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your retail business profile, invoice format, staff access, subscription plan, and security sessions.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 text-sm font-semibold">
        {[
          { id: 'branding', label: 'Store Identity', icon: Building2 },
          { id: 'invoicing', label: 'Invoicing & Tax', icon: Receipt },
          { id: 'staff', label: 'Staff & Roles', icon: Users },
          { id: 'subscription', label: 'Subscription & Limits', icon: CreditCard },
          { id: 'security', label: 'Security & Session', icon: Shield },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === id
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 1. Store Identity & Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900">Store Profile</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  disabled
                  value={formData.businessName}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">Contact SaaS operator to rename business</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Handle (Web Link)</label>
                <input
                  type="text"
                  disabled
                  value={currentBusiness?.handle || currentBusiness?.storeHandle || currentBusiness?.slug || 'my-store'}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Unique store handle used in your public storefront URL</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="store@gmail.com"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Invoicing & Tax Tab */}
      {activeTab === 'invoicing' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900">Invoicing & Tax Configuration</h2>
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Name</label>
                <input
                  type="text"
                  value={formData.taxName}
                  onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                  placeholder="GST / VAT"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  placeholder="INV-"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
              <textarea
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                rows="2"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Tax & Invoice Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Staff & Roles Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Staff Accounts & Permissions</h2>
              <p className="text-xs text-slate-500">
                Grant role-based access for cashiers, inventory managers, and store operators.
              </p>
            </div>
            <button
              onClick={() => setStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {staffList.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <img
                        src={m.userId?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{m.userId?.name || 'Staff Member'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{m.userId?.email}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invite Staff Modal */}
          {staffModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-slate-900">Invite New Staff Member</h3>
                <form onSubmit={handleInviteStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="ramesh@apexretail.com"
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assign Role</label>
                    <select
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                      className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                    >
                      <option value="cashier">Cashier (POS Billing only)</option>
                      <option value="inventory_manager">Inventory Manager (Stock & Catalog)</option>
                      <option value="manager">Manager (Billing, Stock, Reports)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setStaffModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                    >
                      Send Invite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Subscription & Plan Limits Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Subscription Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-300" />
                <h2 className="text-xl font-extrabold">{currentPlan.name || (isFreePlan ? 'Free Starter' : 'Pro')} Plan</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm">
                  Active Subscription
                </span>
              </div>
              <p className="text-blue-100 text-xs max-w-md">
                {isFreePlan ? (
                  <span>
                    ₹0 / Free Forever • Essential billing, single-counter POS & inventory. No monthly renewal charge.
                  </span>
                ) : (
                  <span>
                    ₹{currentPlan.priceMonthly}/month • {subData?.subscription?.currentPeriodEnd ? `Renews on ${new Date(subData.subscription.currentPeriodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Active Monthly Subscription'}. Includes storefront and advanced reports.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isFreePlan ? (
                <button
                  onClick={() => {
                    const proPlan = plans.find((p) => p.slug === 'pro') || plans.find((p) => p.priceMonthly > 0);
                    if (proPlan) handleUpgradePlan(proPlan._id);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Upgrade to Pro (₹999/mo)
                </button>
              ) : (
                <button
                  onClick={() => {
                    const bus = plans.find((p) => p.slug === 'enterprise' || p.slug === 'business');
                    if (bus) handleUpgradePlan(bus._id);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Upgrade to Enterprise (₹2,499)
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Usage Limit Bars */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Plan Quota & Usage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Products</span>
                  <span className="text-slate-900 font-bold">
                    {productCount} / {currentPlan.limits?.maxProducts || 50}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        Math.round((productCount / (currentPlan.limits?.maxProducts || 50)) * 100),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Store Branches</span>
                  <span className="text-slate-900 font-bold">
                    {storesCount} / {currentPlan.limits?.maxStores || 1}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        Math.round((storesCount / (currentPlan.limits?.maxStores || 1)) * 100),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-slate-600">Staff Accounts</span>
                  <span className="text-slate-900 font-bold">
                    {staffList.length} / {currentPlan.limits?.maxStaff || 1}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        Math.round((staffList.length / (currentPlan.limits?.maxStaff || 1)) * 100),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Security & Session Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Account Security & Active Sessions</h2>
                <p className="text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-700">{user?.email}</span> ({user?.role || 'merchant'})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Token & Session Storage:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Guarded via Upstash Redis
                </span>
              </div>
              <p>
                When you sign out, your authorization token is completely purged from localStorage, sessionStorage, cookies, and deleted from the Redis server session cache to prevent any unauthorized reuse.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out (This Browser)</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Immediately revoke this device's token and purge all browser storage and cookies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutThisDevice}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Current Session</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-1">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>Sign Out All Devices</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Invalidate all tokens and active sessions across all mobile apps, tablets, and browsers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutAllDevices}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Revoke All Devices & Sessions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
