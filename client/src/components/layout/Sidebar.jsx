import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingBag,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  Share2,
  Settings,
  Store,
  LogOut,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Store Inventory', path: '/app/inventory', icon: Package },
  { name: 'POS/Billing', path: '/app/bill-format', icon: Receipt },
  { name: 'Online Orders', path: '/app/orders', icon: ShoppingBag },
  { name: 'Customers', path: '/app/customers', icon: Users },
  { name: 'Sales Report', path: '/app/sales-report', icon: TrendingUp },
  { name: 'Reports', path: '/app/reports', icon: BarChart3 },
  { name: 'History', path: '/app/history', icon: Clock },
  { name: 'Share Store', path: '/app/share', icon: Share2 },
];

import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, activeStore, activeBusiness, activeTenant, logout } = useAuth();
  const navigate = useNavigate();
  const currentBusiness = activeBusiness || activeTenant;
  const storeName =
    activeStore?.name ||
    currentBusiness?.name ||
    (user?.name ? (user.name.toLowerCase().endsWith('store') ? user.name : `${user.name} Store`) : 'My Store');

  const handleLogout = async () => {
    await logout();
    navigate('/signin', { replace: true });
  };

  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-200">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-white tracking-tight truncate" title={storeName}>
          {storeName}
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Pinned Bottom Settings */}
      <div className="p-3 border-t border-slate-800/80">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
              isActive
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`
          }
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-medium text-sm text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all duration-150 mt-1 cursor-pointer"
          title="Sign out of your dashboard session"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
