import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowRight, User, Phone, Mail, Lock } from 'lucide-react';

export const RegisterPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to dashboard or platform
  React.useEffect(() => {
    const token = localStorage.getItem('mystore_token');
    if (user && token) {
      const isAdmin =
        user.isAdmin === true ||
        ['super_admin', 'admin'].includes(user.role);
      navigate(isAdmin ? '/platform' : '/app/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = (formData.phone || '').trim().replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit phone number');
      toast.error('Please provide a valid 10-digit phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.register({
        name: formData.name.trim(),
        phone: cleanPhone,
        password: formData.password,
        email: formData.email.trim() || undefined,
      });

      if (res.success && res.data) {
        api.setToken(res.data.token);
        setUser(res.data);
        toast.success('Account created successfully! Welcome to BisonMooves Store.');

        const isAdmin =
          res.data.isAdmin === true ||
          ['super_admin', 'admin'].includes(res.data.role);

        if (isAdmin) {
          navigate('/platform', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Store className="w-7 h-7" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">BisonMooves Store</span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your merchant account</h2>
        <p className="text-xs text-slate-500">Sign up using your phone number to launch your store</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Phone Number *</label>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">Primary Login ID</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter 10-digit mobile number"
                  autoComplete="tel"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address <span className="font-normal text-slate-400 text-[11px]">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul@store.com (optional)"
                  autoComplete="email"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Creating account...' : 'Continue to Store Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-blue-600 hover:underline">
              Sign in with Phone
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
