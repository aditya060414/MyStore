const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('mystore_token') || null;
    this.activeBusinessId =
      localStorage.getItem('mystore_active_business_id') ||
      localStorage.getItem('mystore_active_tenant_id') ||
      null;
    this.activeTenantId = this.activeBusinessId;
  }

  clearClientAuth() {
    this.token = null;
    this.activeBusinessId = null;
    this.activeTenantId = null;

    try {
      localStorage.removeItem('mystore_token');
      localStorage.removeItem('mystore_active_business_id');
      localStorage.removeItem('mystore_active_tenant_id');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');

      sessionStorage.clear();

      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        }
      }
    } catch (e) {
      console.warn('[ApiService] Error purging storage and cookies:', e);
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('mystore_token', token);
    } else {
      this.clearClientAuth();
    }
  }

  setActiveBusinessId(businessId) {
    this.activeBusinessId = businessId;
    this.activeTenantId = businessId;
    if (businessId) {
      localStorage.setItem('mystore_active_business_id', businessId);
      localStorage.setItem('mystore_active_tenant_id', businessId);
    } else {
      localStorage.removeItem('mystore_active_business_id');
      localStorage.removeItem('mystore_active_tenant_id');
    }
  }

  // Compatibility alias
  setActiveTenantId(tenantId) {
    this.setActiveBusinessId(tenantId);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.activeBusinessId) {
      headers['X-Business-Id'] = this.activeBusinessId;
      headers['X-Tenant-Id'] = this.activeBusinessId;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      ...this.getHeaders(),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, missing, or terminated in Redis
          this.clearClientAuth();

          const path = window.location.pathname;
          const isPublic =
            path === '/' ||
            path.startsWith('/signin') ||
            path.startsWith('/login') ||
            path.startsWith('/signup') ||
            path.startsWith('/register') ||
            path.startsWith('/store/');

          if (!isPublic) {
            window.location.replace(`/signin?session_expired=true&from=${encodeURIComponent(path)}`);
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name, email, password, phone) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    });
  }

  async logout() {
    const tokenToRevoke = this.token;
    try {
      if (tokenToRevoke) {
        await this.request('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenToRevoke}` },
        });
      }
    } catch (e) {
      console.warn('[ApiService] Remote logout failed or offline:', e.message);
    } finally {
      // Unconditionally purge tokens from memory, headers, cookies, and storage
      this.clearClientAuth();
    }
  }

  async logoutAll() {
    const tokenToRevoke = this.token;
    try {
      if (tokenToRevoke) {
        await this.request('/auth/logout-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenToRevoke}` },
        });
      }
    } catch (e) {
      console.warn('[ApiService] Remote logout-all failed or offline:', e.message);
    } finally {
      this.clearClientAuth();
    }
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async getSession() {
    return this.request('/auth/session');
  }


  // Businesses & Onboarding
  async onboardBusiness(data) {
    return this.request('/businesses/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentBusiness() {
    return this.request('/businesses/current');
  }

  async updateSettings(settingsData) {
    return this.request('/businesses/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  async getStaff() {
    return this.request('/businesses/staff');
  }

  async addStaff(staffData) {
    return this.request('/businesses/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  // Compatibility aliases
  async onboardTenant(data) {
    return this.onboardBusiness(data);
  }

  async getCurrentTenant() {
    return this.getCurrentBusiness();
  }

  // Products & Inventory
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== '') {
        query.append(key, params[key]);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/products${queryString}`);
  }

  async getProduct(idOrBarcode) {
    return this.request(`/products/${idOrBarcode}`);
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async addProductStock(id, { quantityToAdd, reason }) {
    return this.request(`/products/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify({ quantityToAdd, reason }),
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // POS Sales & Billing
  async createSale(saleData) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async getSales(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/sales${query ? `?${query}` : ''}`);
  }

  async getSaleById(idOrBill) {
    return this.request(`/sales/${idOrBill}`);
  }

  // Online Orders
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders${query ? `?${query}` : ''}`);
  }

  async updateOrderStatus(id, statusData) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  }

  // Public Storefront
  async getPublicStoreCatalog(storeHandle) {
    return this.request(`/orders/public/${storeHandle}`);
  }

  async createPublicOrder(storeHandle, orderData) {
    return this.request(`/orders/public/${storeHandle}`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async trackPublicOrder(orderNumber) {
    return this.request(`/orders/public/track/${orderNumber}`);
  }

  // Reports
  async getDashboardMetrics() {
    return this.request('/reports/dashboard');
  }

  async getFinancialReport(range) {
    return this.request(`/reports/financial${range ? `?range=${range}` : ''}`);
  }

  // History & Audit Logs
  async getHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/history${query ? `?${query}` : ''}`);
  }

  // Subscriptions & Plans
  async getPlans() {
    return this.request('/subscriptions/plans');
  }

  async getCurrentSubscription() {
    return this.request('/subscriptions/current');
  }

  async upgradePlan(planId, billingCycle) {
    return this.request('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle }),
    });
  }

  // Platform Admin
  async getPlatformOverview() {
    return this.request('/platform/overview');
  }

  async getPlatformBusinesses() {
    return this.request('/platform/businesses');
  }

  async updatePlatformBusinessStatus(businessId, status) {
    return this.request(`/platform/businesses/${businessId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updatePlatformBusinessPlan(businessId, planId, status) {
    return this.request(`/platform/businesses/${businessId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ planId, status }),
    });
  }

  async grantPlatformBusinessFreebie(businessId, freebieData) {
    return this.request(`/platform/businesses/${businessId}/freebie`, {
      method: 'POST',
      body: JSON.stringify(freebieData),
    });
  }

  async getPlatformPlans() {
    return this.request('/platform/plans');
  }

  async createPlatformPlan(planData) {
    return this.request('/platform/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async updatePlatformPlan(planId, planData) {
    return this.request(`/platform/plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

  async togglePlatformPlanStatus(planId, isActive) {
    return this.request(`/platform/plans/${planId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async deletePlatformPlan(planId, force = false) {
    return this.request(`/platform/plans/${planId}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    });
  }

  async getPlatformAds() {
    return this.request('/platform/ads');
  }

  async createPlatformAd(adData) {
    return this.request('/platform/ads', {
      method: 'POST',
      body: JSON.stringify(adData),
    });
  }

  async updatePlatformAdStatus(adId, status) {
    return this.request(`/platform/ads/${adId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deletePlatformAd(adId) {
    return this.request(`/platform/ads/${adId}`, {
      method: 'DELETE',
    });
  }

  async getPlatformPromotions() {
    return this.request('/platform/promotions');
  }

  async createPlatformPromotion(promoData) {
    return this.request('/platform/promotions', {
      method: 'POST',
      body: JSON.stringify(promoData),
    });
  }

  async getPlatformBroadcast() {
    return this.request('/platform/broadcast');
  }

  async setPlatformBroadcast(broadcastData) {
    return this.request('/platform/broadcast', {
      method: 'POST',
      body: JSON.stringify(broadcastData),
    });
  }

  // Compatibility aliases
  async getPlatformTenants() {
    return this.getPlatformBusinesses();
  }

  async updatePlatformTenantStatus(tenantId, status) {
    return this.updatePlatformBusinessStatus(tenantId, status);
  }
}

export const api = new ApiService();
