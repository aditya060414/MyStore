const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('mystore_token') || null;
    this.activeTenantId = localStorage.getItem('mystore_active_tenant_id') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('mystore_token', token);
    } else {
      localStorage.removeItem('mystore_token');
    }
  }

  setActiveTenantId(tenantId) {
    this.activeTenantId = tenantId;
    if (tenantId) {
      localStorage.setItem('mystore_active_tenant_id', tenantId);
    } else {
      localStorage.removeItem('mystore_active_tenant_id');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.activeTenantId) {
      headers['X-Tenant-Id'] = this.activeTenantId;
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

  async getMe() {
    return this.request('/auth/me');
  }

  // Tenants & Onboarding
  async onboardTenant(data) {
    return this.request('/tenants/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentTenant() {
    return this.request('/tenants/current');
  }

  async updateSettings(settingsData) {
    return this.request('/tenants/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  async getStaff() {
    return this.request('/tenants/staff');
  }

  async addStaff(staffData) {
    return this.request('/tenants/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
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
  async createPublicOrder(storeSlug, orderData) {
    return this.request(`/orders/public/${storeSlug}`, {
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

  async getPlatformTenants() {
    return this.request('/platform/tenants');
  }

  async updatePlatformTenantStatus(tenantId, status) {
    return this.request(`/platform/tenants/${tenantId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiService();
