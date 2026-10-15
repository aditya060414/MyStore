import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Crown,
} from 'lucide-react';

export const OnboardingPage = () => {
  const { setActiveTenant } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [businessName, setBusinessName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [address, setAddress] = useState('123 Market Street');
  const [planSlug, setPlanSlug] = useState('pro');
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        businessName,
        storeName: storeName || businessName,
        phone,
        city,
        address,
        planSlug,
      };

      const res = await api.onboardTenant(payload);
      if (res.success && res.data) {
        setActiveTenant(res.data.tenant);
        api.setActiveTenantId(res.data.tenant._id);
        navigate('/app/dashboard');
      }
    } catch (err) {
      alert(`Onboarding error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] flex flex-col justify-center py-12 px-6 font-sans">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Progress header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Onboarding Wizard</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Setup your retail business</h2>
          <p className="text-xs text-slate-500">Step {step} of 3 • Takes less than 2 minutes</p>

          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? 'w-8 bg-blue-600' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80">
          {/* Step 1: Business Details */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Supermarket"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">This will be your legal merchant tenant name</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!businessName.trim()}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Next: Store Branch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Store Branch Details */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Store Branch Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={businessName ? `${businessName} - Main Branch` : 'e.g. Indiranagar Store'}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bangalore"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Market Street"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-slate-500 font-bold hover:text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Next: Choose Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Plan & Launch */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <p className="font-semibold text-slate-700">Select your SaaS subscription tier</p>

              <div className="space-y-2.5">
                {[
                  {
                    slug: 'pro',
                    name: 'Pro Retailer (Recommended)',
                    price: '₹999 / mo',
                    desc: '500 products, online storefront, QR store sharing, profit reports',
                    badge: '14-Day Free Trial',
                  },
                  {
                    slug: 'free',
                    name: 'Free Tier',
                    price: '₹0',
                    desc: '50 products, basic POS billing, thermal receipts',
                  },
                  {
                    slug: 'business',
                    name: 'Business Chain',
                    price: '₹2,499 / mo',
                    desc: '5,000 products, 5 branches, 20 staff accounts',
                  },
                ].map((p) => (
                  <div
                    key={p.slug}
                    onClick={() => setPlanSlug(p.slug)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      planSlug === p.slug
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        {p.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm shrink-0">{p.price}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-slate-500 font-bold hover:text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <span>{submitting ? 'Launching Store...' : 'Launch MyStore Dashboard'}</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
