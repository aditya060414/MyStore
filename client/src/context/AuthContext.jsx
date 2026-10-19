import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const deduplicateBusinesses = (list) => {
  if (!list || !Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenNames = new Set();
  return list.filter((m) => {
    const b = m.business || m.tenant || m;
    const bId = b?._id;
    const bName = (b?.name || '').trim().toLowerCase();
    if (!bId || seenIds.has(bId) || seenNames.has(bName)) return false;
    seenIds.add(bId);
    seenNames.add(bName);
    return true;
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [activeStore, setActiveStore] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cross-tab logout listener & storage event listener
  useEffect(() => {
    let authChannel;
    try {
      authChannel = new BroadcastChannel('mystore_auth_sync');
      authChannel.onmessage = (event) => {
        if (event.data === 'LOGOUT') {
          api.clearClientAuth();
          setUser(null);
          setBusinesses([]);
          setActiveBusiness(null);
          setActiveStore(null);
          setRole(null);
          const path = window.location.pathname;
          if (path.startsWith('/app') || path.startsWith('/platform') || path.startsWith('/admin')) {
            window.location.replace('/signin');
          }
        }
      };
    } catch (_) {}

    const handleStorageChange = (e) => {
      if (e.key === 'mystore_token' && !e.newValue) {
        api.clearClientAuth();
        setUser(null);
        setBusinesses([]);
        setActiveBusiness(null);
        setActiveStore(null);
        setRole(null);
        const path = window.location.pathname;
        if (path.startsWith('/app') || path.startsWith('/platform') || path.startsWith('/admin')) {
          window.location.replace('/signin');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (authChannel) {
        try {
          authChannel.close();
        } catch (_) {}
      }
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('mystore_token');
      if (token) {
        api.setToken(token);
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            const userBusinesses = deduplicateBusinesses(res.data.businesses || res.data.tenants || []);
            setBusinesses(userBusinesses);

            const savedBusinessId =
              localStorage.getItem('mystore_active_business_id') ||
              localStorage.getItem('mystore_active_tenant_id');

            const foundMembership =
              userBusinesses.find((m) => (m.business?._id || m.tenant?._id) === savedBusinessId) ||
              userBusinesses[0];

            const isPlatformAdmin =
              res.data.isAdmin === true ||
              ['super_admin', 'admin'].includes(res.data.role);

            if (isPlatformAdmin) {
              setRole(res.data.role || 'super_admin');
            }

            if (foundMembership) {
              const b = foundMembership.business || foundMembership.tenant;
              const s = foundMembership.store;
              setActiveBusiness(b);
              setActiveStore(s || null);
              if (!isPlatformAdmin) {
                setRole(foundMembership.role);
              }
              api.setActiveBusinessId(b._id);
            }
          }
        } catch (error) {
          console.warn('[AuthContext] Session expired or invalid:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.data) {
      setUser(res.data);
      api.setToken(res.data.token);
      const userBusinesses = deduplicateBusinesses(res.data.businesses || res.data.tenants || []);
      setBusinesses(userBusinesses);

      const isPlatformAdmin =
        res.data.isAdmin === true ||
        ['super_admin', 'admin'].includes(res.data.role);

      if (isPlatformAdmin) {
        setRole(res.data.role || 'super_admin');
      }

      if (userBusinesses.length > 0) {
        const primaryMembership = userBusinesses[0];
        const b = primaryMembership.business || primaryMembership.tenant;
        const s = primaryMembership.store;
        setActiveBusiness(b);
        setActiveStore(s || null);
        if (!isPlatformAdmin) {
          setRole(primaryMembership.role);
        }
        api.setActiveBusinessId(b._id);
      }

      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const switchBusiness = (businessId) => {
    const found = businesses.find((m) => (m.business?._id || m.tenant?._id) === businessId);
    if (found) {
      const b = found.business || found.tenant;
      const s = found.store;
      setActiveBusiness(b);
      setActiveStore(s || null);
      setRole(found.role);
      api.setActiveBusinessId(b._id);
      window.location.reload();
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('[AuthContext] Remote logout error:', err.message);
    } finally {
      api.clearClientAuth();
      setUser(null);
      setBusinesses([]);
      setActiveBusiness(null);
      setActiveStore(null);
      setRole(null);
      try {
        const channel = new BroadcastChannel('mystore_auth_sync');
        channel.postMessage('LOGOUT');
        channel.close();
      } catch (_) {}
    }
  };

  const logoutAll = async () => {
    try {
      await api.logoutAll();
    } catch (err) {
      console.warn('[AuthContext] Remote logoutAll error:', err.message);
    } finally {
      api.clearClientAuth();
      setUser(null);
      setBusinesses([]);
      setActiveBusiness(null);
      setActiveStore(null);
      setRole(null);
      try {
        const channel = new BroadcastChannel('mystore_auth_sync');
        channel.postMessage('LOGOUT');
        channel.close();
      } catch (_) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businesses,
        activeBusiness,
        activeStore,
        role,
        loading,
        login,
        logout,
        logoutAll,
        switchBusiness,
        setActiveBusiness,
        setActiveStore,
        setUser,
        // Backward-compatibility aliases
        tenants: businesses,
        activeTenant: activeBusiness,
        setActiveTenant: setActiveBusiness,
        switchTenant: switchBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
