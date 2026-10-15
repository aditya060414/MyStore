# MyStore — Multi-Tenant Retail Management SaaS

A commercial, production-ready, multi-tenant retail SaaS platform engineered for independent retail shops, grocery stores, supermarkets, and convenience businesses.

## Key Capabilities

- **Strict Multi-Tenant Architecture**: Each business tenant has completely isolated products, inventory, customers, sales, orders, reports, and staff access.
- **Point of Sale (POS) & Live Billing**: Fast product search, barcode scanner integration, customer lookup, quantity controls, discount & tax calculations, and real-time A4 / Thermal bill preview with barcode.
- **Inventory & Stock Management**: Product catalog with SKU, brand, category, selling price, purchase cost (COGS snapshot), stock threshold alerts, and 15-day expiry warnings.
- **Online Storefront**: Dedicated customer-facing digital storefront (`/store/:storeSlug`) with categories, search, shopping cart, delivery address checkout, and order status tracking.
- **Share Store & QR Marketing**: Instant store sharing via WhatsApp, Twitter, Facebook, plus auto-generated high-res QR codes and printable countertop stand posters.
- **Reports & Analytics**: Daily/weekly/monthly revenue tracking, gross profit analysis, cost of goods sold (COGS) deduction, online vs. offline sales comparison, and category distribution.
- **Staff Roles & RBAC**: Role-based permissions for Owner, Manager, Cashier (POS-only), and Inventory Manager.
- **Platform Admin Console**: Private dashboard for the SaaS operator to monitor MRR, ARR, tenant health, churn, and plan subscriptions.

---

## Tech Stack

- **Client**: React 19, Vite, Tailwind CSS v3, React Router DOM, Lucide React, Recharts, QRCode.react.
- **Server**: Node.js, Express.js (ES Modules), Mongoose, JSON Web Tokens (JWT), Bcrypt.js, Morgan.
- **Database**: MongoDB Atlas / Local MongoDB.

---

## Project Structure

```
├── client/                     # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/layout/  # Sidebar, Navbar, AppLayout
│   │   ├── context/            # AuthContext (multi-tenant session & switching)
│   │   ├── pages/
│   │   │   ├── merchant/       # Dashboard, Inventory, Bill Format, Orders, Reports, History, Share Store, Settings
│   │   │   ├── public/         # Online Storefront & Order Tracking
│   │   │   ├── platform/       # SaaS Operator Platform Admin Console
│   │   │   ├── marketing/      # Public Landing Page & Features
│   │   │   └── auth/           # Login, Register, Onboarding Wizard
│   │   └── services/           # API Client with Tenant Scoping Headers
│   └── package.json
│
├── server/                     # Node.js + Express REST API
│   ├── config/                 # Database connection & config
│   ├── controllers/            # Auth, Tenant, Product, Sale, Order, Report, History, Subscription, Platform
│   ├── middleware/             # Auth, Tenant Isolation, RBAC, Error Handling
│   ├── models/                 # User, Tenant, Store, Membership, Plan, Subscription, Product, Customer, Sale, Order, InventoryMovement, AuditLog
│   ├── routes/                 # Versioned REST endpoints (/api/v1/...)
│   ├── seed/                   # Database seed script
│   └── server.js               # Express application entrypoint
│
└── .gitignore
```

---

## Quick Start Guide

### 1. Backend Server Setup
```bash
cd server
npm install
npm run seed     # Pre-populates SaaS plans, demo tenants, and sample products
npm run dev      # Starts server on http://localhost:5000
```

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev      # Starts client on http://localhost:5173
```

---

## Demo Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Apex Supermarket Owner** | `rahul@apexretail.com` | `password123` | Full Merchant Dashboard & Settings |
| **Apex Cashier** | `sneha@apexretail.com` | `password123` | POS Billing & Cashier Desk |
| **Platform Operator** | `admin@mystore.com` | `admin123` | SaaS Console (`/platform`), MRR & Tenants |
| **GreenMart Organics Owner** | `pooja@greenmart.com` | `password123` | Demonstrates complete multi-tenant isolation |
