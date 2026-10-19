import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Store,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('session_expired') ? 'Your session expired. Please sign in to continue.' : ''
  );
  const [submitting, setSubmitting] = useState(false);

  // If user is already logged in with token, redirect them to admin or store
  React.useEffect(() => {
    const token = localStorage.getItem('mystore_token');
    if (user && token) {
      const isAdmin =
        user.isAdmin === true ||
        ['super_admin', 'admin'].includes(user.role);

      if (isAdmin) {
        navigate('/platform', { replace: true });
      } else {
        const fromPath = location.state?.from?.pathname;
        const isRestrictedTarget = fromPath && (fromPath.startsWith('/platform') || fromPath.startsWith('/admin'));
        const destination = (!isRestrictedTarget && fromPath) ? fromPath : '/app/dashboard';
        navigate(destination, { replace: true });
      }
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.name || 'User'}!`);
      // Admin verification at login strictly from backend role
      const isAdmin =
        data.isAdmin === true ||
        ['super_admin', 'admin'].includes(data.role);

      if (isAdmin) {
        // Route verified Admin to Platform Admin console
        navigate('/platform', { replace: true });
      } else {
        // Route customer / merchant to store dashboard
        const fromPath = location.state?.from?.pathname;
        const isRestrictedTarget = fromPath && (fromPath.startsWith('/platform') || fromPath.startsWith('/admin'));
        const destination = (!isRestrictedTarget && fromPath) ? fromPath : '/app/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed. Please check your credentials.';
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your dashboard</h2>
        <p className="text-xs text-slate-500">Enter your credentials to access your store</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have a retail store account yet?{' '}
            <Link to="/signup" className="font-bold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
