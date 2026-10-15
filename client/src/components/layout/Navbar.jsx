import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Building2,
  ExternalLink,
  Store,
} from 'lucide-react';

export const Navbar = () => {
  const { user, tenants, activeTenant, switchTenant, logout, role } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input Bar */}
      <div className="w-96 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search items, orders, customers..."
          className="w-full bg-[#f1f5f9] text-sm text-slate-700 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
        {/* Storefront Quick Link */}
        {activeTenant && (
          <a
            href={`/store/${activeTenant.slug || 'apex-indiranagar'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>View Public Store</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
          </a>
        )}

        {/* Theme Toggle (Sun / Moon) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setIsDark(false)}
            className={`p-1.5 rounded-lg transition-all ${
              !isDark ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Light Mode"
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDark(true)}
            className={`p-1.5 rounded-lg transition-all ${
              isDark ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
            title="Dark Mode"
          >
            <Moon className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile & Tenant Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            <div className="text-left hidden sm:block">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                {user?.name || 'Admin'}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <span className="text-xs text-slate-500 capitalize">{activeTenant?.name || role || 'Merchant'}</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-slate-800 truncate">{user?.email || 'admin@mystore.com'}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded-md">
                    {role ? role.toUpperCase() : 'OWNER'}
                  </span>
                  {activeTenant?.planId?.name && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded-md">
                      {activeTenant.planId.name} PLAN
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-Tenant Switcher */}
              {tenants && tenants.length > 1 && (
                <div className="py-2 px-2 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase">Switch Business</p>
                  {tenants.map((m) => (
                    <button
                      key={m.tenant?._id}
                      onClick={() => {
                        switchTenant(m.tenant?._id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium ${
                        m.tenant?._id === activeTenant?._id
                          ? 'bg-blue-50 text-blue-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.tenant?.name}</span>
                      </span>
                      {m.tenant?._id === activeTenant?._id && (
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Platform Console Shortcut (for Platform Admin) */}
              {user?.role === 'platform_admin' && (
                <Link
                  to="/platform"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Platform Admin Console</span>
                </Link>
              )}

              <Link
                to="/app/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>Store Settings</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
