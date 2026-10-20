# BisonMooves Store — Multi-Business Retail Management SaaS

A commercial, production-ready, multi-business retail SaaS platform engineered for independent retail shops, grocery stores, supermarkets, and convenience businesses.

## Key Capabilities

- **Strict Multi-Business Architecture**: Each business has completely isolated products, inventory, customers, sales, orders, reports, and staff access.
- **Point of Sale (POS) & Live Billing**: Fast product search, barcode scanner integration, customer lookup, quantity controls, discount & tax calculations, and real-time A4 / Thermal bill preview with barcode.
- **Inventory & Stock Management**: Product catalog with SKU, brand, category, selling price, purchase cost (COGS snapshot), stock threshold alerts, and 15-day expiry warnings.
- **Online Storefront**: Dedicated customer-facing digital storefront (`/store/:storeSlug`) with categories, search, shopping cart, delivery address checkout, and order status tracking.
- **Share Store & QR Marketing**: Instant store sharing via WhatsApp, Twitter, Facebook, plus auto-generated high-res QR codes and printable countertop stand posters.
- **Reports & Analytics**: Daily/weekly/monthly revenue tracking, gross profit analysis, cost of goods sold (COGS) deduction, online vs. offline sales comparison, and category distribution.
- **Staff Roles & RBAC**: Role-based permissions for Owner, Manager, Cashier (POS-only), and Inventory Manager.
- **Platform Admin Console**: Private dashboard for the SaaS operator to monitor MRR, ARR, business health, churn, and plan subscriptions.

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
│   │   ├── context/            # AuthContext (multi-business session & switching)
│   │   ├── pages/
│   │   │   ├── merchant/       # Dashboard, Inventory, POS / Billing, Orders, Customers, Reports, History, Share Store, Settings
│   │   │   ├── public/         # Online Storefront & Order Tracking
│   │   │   ├── platform/       # SaaS Operator Platform Admin Console
│   │   │   ├── marketing/      # Public Landing Page & Features
│   │   │   └── auth/           # Login, Register, Onboarding Wizard
│   │   └── services/           # API Client with Business Scoping Headers
│   └── package.json
│
├── server/                     # Node.js + Express REST API
│   ├── config/                 # Database connection & config
│   ├── controllers/            # Auth, Business, Product, Sale, Order, Report, History, Subscription, Platform
│   ├── middleware/             # Auth, Business Isolation, RBAC, Error Handling
│   ├── models/                 # User, Business, Store, Membership, Plan, Subscription, Product, Customer, Sale, Order, InventoryMovement, AuditLog
│   ├── routes/                 # Versioned REST endpoints (/api/v1/...)
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
npm run dev      # Starts server on http://localhost:5000 (auto-initializes foundational SaaS plans)
```

### 2. Frontend Client Setup
```bash
cd client
npm install
npm run dev      # Starts client on http://localhost:5173
```

---

## Getting Started

1. **Sign Up**: Navigate to `/signup` to register your merchant account.
2. **Onboard Your Business**: Follow the 3-step onboarding wizard to register your business name, primary store branch, and choose a subscription plan.
3. **Add Products & Start Selling**: Use the POS Terminal and Inventory Manager to add your inventory, scan barcodes, and generate bills.
