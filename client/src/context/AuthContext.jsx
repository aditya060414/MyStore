import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [activeTenant, setActiveTenant] = useState(null);
  const [activeStore, setActiveStore] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
            setTenants(res.data.tenants || []);

            const savedTenantId = localStorage.getItem('mystore_active_tenant_id');
            const foundMembership = res.data.tenants?.find(
              (m) => m.tenant?._id === savedTenantId
            ) || res.data.tenants?.[0];

            if (foundMembership) {
              setActiveTenant(foundMembership.tenant);
              setRole(foundMembership.role);
              api.setActiveTenantId(foundMembership.tenant._id);
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
      setTenants(res.data.tenants || []);

      if (res.data.tenants && res.data.tenants.length > 0) {
        const primaryMembership = res.data.tenants[0];
        setActiveTenant(primaryMembership.tenant);
        setRole(primaryMembership.role);
        api.setActiveTenantId(primaryMembership.tenant._id);
      } else if (res.data.role === 'platform_admin') {
        setRole('platform_admin');
      }

      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const switchTenant = (tenantId) => {
    const found = tenants.find((t) => t.tenant?._id === tenantId);
    if (found) {
      setActiveTenant(found.tenant);
      setRole(found.role);
      api.setActiveTenantId(found.tenant._id);
      window.location.reload();
    }
  };

  const logout = () => {
    api.setToken(null);
    api.setActiveTenantId(null);
    setUser(null);
    setTenants([]);
    setActiveTenant(null);
    setActiveStore(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        activeTenant,
        activeStore,
        role,
        loading,
        login,
        logout,
        switchTenant,
        setActiveTenant,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
