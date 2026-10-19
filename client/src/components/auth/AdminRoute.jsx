import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowLeft, LogIn, Store } from 'lucide-react';

export const AdminRoute = ({ children }) => {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090d16] text-white space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-xs text-slate-400 font-medium">Verifying administrator authorization...</p>
      </div>
    );
  }

  const token = localStorage.getItem('mystore_token');

  // If user is not logged in at all or token is deleted, redirect to signin
  if (!user || !token) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check if current user is an authorized platform administrator or developer
  const isPlatformAdmin =
    user.isAdmin === true ||
    ['super_admin', 'admin'].includes(user.role) ||
    ['super_admin', 'admin'].includes(role);

  // If logged in but not an authorized admin, display 403 Access Denied
  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-6 selection:bg-rose-500 selection:text-white">
        <div className="w-full max-w-lg bg-[#111827] rounded-3xl p-8 border border-rose-500/30 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              403 Forbidden • Access Denied
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Administrator Privileges Required
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              The Platform Operator Console is strictly restricted to verified system operators and platform developers.
            </p>
          </div>

          {/* Current Session Details Card */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Signed In As:</span>
              <span className="font-bold text-white">{user.phone || user.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Account Name:</span>
              <span className="font-semibold text-slate-300">{user.name || 'Merchant'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Current Role:</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-amber-300">
                {user.role || 'merchant'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              to="/app/dashboard"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Go to Merchant Dashboard</span>
            </Link>

            <Link
              to="/signin"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Switch Account</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
