import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export const PlatformAdminPage = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, tenRes] = await Promise.all([
          api.getPlatformOverview(),
          api.getPlatformTenants(),
        ]);
        if (ovRes.success) setOverview(ovRes.data.metrics);
        if (tenRes.success) setTenants(tenRes.data);
      } catch (err) {
        console.error('Failed to load platform data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updatePlatformTenantStatus(tenantId, newStatus);
      const tenRes = await api.getPlatformTenants();
      if (tenRes.success) setTenants(tenRes.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const metrics = overview || {
    totalTenants: 28,
    activePayingTenants: 22,
    trialingTenants: 4,
    cancelledTenants: 2,
    mrr: 48500,
    arr: 582000,
    conversionRate: 74,
    churnRate: 2.4,
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.slug && t.slug.toLowerCase().includes(search.toLowerCase())) ||
      (t.ownerId?.email && t.ownerId.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      {/* Platform Header */}
      <header className="bg-[#0f172a] text-white py-4 px-8 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Platform Admin Console</h1>
            <p className="text-xs text-indigo-200">MyStore SaaS Operator Control Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            <Store className="w-4 h-4 text-blue-400" />
            <span>Open Merchant App</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">SaaS Business Analytics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key operational metrics across registered tenants, subscriptions, and recurring revenue.
          </p>
        </div>

        {/* Financial & Tenant Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Monthly Recurring Revenue (MRR)</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{metrics.mrr.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% from last month
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Annual Run Rate (ARR)</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">₹{metrics.arr.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Contracted annualized value</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Active Paying Tenants</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.activePayingTenants}</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Out of {metrics.totalTenants} total businesses ({metrics.conversionRate}% conv.)
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Subscription Churn</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{metrics.churnRate}%</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Healthy below 3% industry benchmark</p>
          </div>
        </div>

        {/* Tenants List Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registered Business Tenants</h3>
              <p className="text-xs text-slate-500">Manage shop subscriptions, branch counts, and tenant access.</p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business, slug, email..."
                className="w-full bg-[#f8fafc] text-xs text-slate-800 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Owner Email</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4 text-center">Branches</th>
                  <th className="py-3 px-4 text-center">Staff</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTenants.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>
                        <p>{t.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">/{t.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.ownerId?.email || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                        {t.planId?.name || 'Pro'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{t.storeCount || 1}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{t.staffCount || 1}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          t.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : t.status === 'suspended'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(t._id, t.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          t.status === 'active'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {t.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
