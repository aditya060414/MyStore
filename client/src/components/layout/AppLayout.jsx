import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { api } from '../../services/api';
import { Bell, X } from 'lucide-react';

export const AppLayout = () => {
  const [broadcast, setBroadcast] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return (
        localStorage.getItem('mystore_broadcast_dismissed') === 'true' ||
        Boolean(localStorage.getItem('mystore_broadcast_dismissed_msg'))
      );
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const res = await api.getPlatformBroadcast();
        if (res.success && res.data?.active && res.data?.message) {
          const isDismissed =
            localStorage.getItem('mystore_broadcast_dismissed') === 'true' ||
            localStorage.getItem('mystore_broadcast_dismissed_msg') === res.data.message;

          if (!isDismissed) {
            setBroadcast(res.data);
          }
        }
      } catch (_) {
        // silent fallback
      }
    };
    fetchBroadcast();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('mystore_broadcast_dismissed', 'true');
      if (broadcast?.message) {
        localStorage.setItem('mystore_broadcast_dismissed_msg', broadcast.message);
      }
    } catch (_) {}
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fc] text-slate-800 antialiased font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        {/* Global Platform Broadcast Banner */}
        {broadcast && !dismissed && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-indigo-100 px-6 py-2.5 text-xs flex items-center justify-between border-b border-indigo-900/50 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <Bell className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="font-semibold text-slate-200">{broadcast.message}</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss Announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
