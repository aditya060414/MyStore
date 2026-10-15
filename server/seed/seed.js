import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Plan from '../models/Plan.js';
import Tenant from '../models/Tenant.js';
import Store from '../models/Store.js';
import Membership from '../models/Membership.js';
import Subscription from '../models/Subscription.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import InventoryMovement from '../models/InventoryMovement.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mystore_saas';

export const runSeed = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Plan.deleteMany({}),
      Tenant.deleteMany({}),
      Store.deleteMany({}),
      Membership.deleteMany({}),
      Subscription.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Sale.deleteMany({}),
      Order.deleteMany({}),
      InventoryMovement.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Cleared old collections');

    // 1. Create SaaS Plans
    const plans = await Plan.insertMany([
      {
        name: 'Free',
        slug: 'free',
        description: 'Perfect for small kiosks and single-person popups.',
        priceMonthly: 0,
        priceAnnual: 0,
        sortOrder: 1,
        features: ['1 Store Location', 'Up to 50 Products', 'Basic POS Billing', 'Standard Thermal Receipts', '1 Staff Account'],
        limits: {
          maxStores: 1,
          maxProducts: 50,
          maxStaff: 1,
          onlineStorefront: false,
          advancedReports: false,
          qrStoreSharing: true,
          customBranding: false,
          prioritySupport: false,
        },
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'For growing retail shops wanting online orders & inventory automation.',
        priceMonthly: 999,
        priceAnnual: 9990,
        sortOrder: 2,
        features: [
          '1 Store Location',
          'Up to 500 Products',
          'Online Storefront & Orders',
          'QR Code Store Sharing',
          'Gross Profit & Sales Reports',
          'Low Stock & Expiry Alerts',
          '5 Staff Accounts & Roles',
          'CSV Inventory Import/Export',
        ],
        limits: {
          maxStores: 1,
          maxProducts: 500,
          maxStaff: 5,
          onlineStorefront: true,
          advancedReports: true,
          qrStoreSharing: true,
          customBranding: true,
          prioritySupport: false,
        },
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'For multi-store retail chains and high-volume supermarkets.',
        priceMonthly: 2499,
        priceAnnual: 24990,
        sortOrder: 3,
        features: [
          'Up to 5 Store Branches',
          'Up to 5,000 Products',
          'Unlimited Online Orders',
          'Advanced Financial Analytics',
          '20 Staff Accounts with RBAC',
          'Multi-location Inventory Transfer',
          'Dedicated Account Manager',
          '24/7 Priority Support',
        ],
        limits: {
          maxStores: 5,
          maxProducts: 5000,
          maxStaff: 20,
          onlineStorefront: true,
          advancedReports: true,
          qrStoreSharing: true,
          customBranding: true,
          prioritySupport: true,
        },
      },
    ]);
    const proPlan = plans.find((p) => p.slug === 'pro');
    console.log('[Seed] Created Plans');

    // 2. Create Platform SaaS Admin
    const platformAdmin = await User.create({
      name: 'Aditya (Platform Admin)',
      email: 'admin@mystore.com',
      password: 'admin123',
      phone: '9876500000',
      role: 'platform_admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    });

    // 3. Create Tenant 1 (Apex Supermarket - matches user screenshots)
    const apexOwner = await User.create({
      name: 'Rahul Mehta',
      email: 'rahul@apexretail.com',
      password: 'password123',
      phone: '9876543210',
      role: 'merchant_user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    });

    const apexCashier = await User.create({
      name: 'Sneha Kapoor',
      email: 'sneha@apexretail.com',
      password: 'password123',
      phone: '9876543211',
      role: 'merchant_user',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    });

    const apexTenant = await Tenant.create({
      name: 'Apex Supermarket',
      slug: 'apex-supermarket',
      ownerId: apexOwner._id,
      status: 'active',
      planId: proPlan._id,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      contactPhone: '9876543210',
      contactEmail: 'rahul@apexretail.com',
      settings: {
        taxRate: 0,
        taxName: 'GST',
        invoicePrefix: 'INV-',
        billFormat: 'A4 - Standard',
        receiptHeader: 'MyStore',
        receiptFooter: 'Thank you for shopping with us! Visit again | MyStore',
      },
    });

    const apexStore = await Store.create({
      tenantId: apexTenant._id,
      name: 'Apex Supermarket - Indiranagar',
      slug: 'apex-indiranagar',
      phone: '9876543210',
      email: 'mystore@gmail.com',
      isPrimary: true,
      address: {
        street: '123 Market Street',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      storefrontDescription: 'Best daily essentials, fresh dairy, cold beverages, and quick snacks.',
    });

    const apexSub = await Subscription.create({
      tenantId: apexTenant._id,
      planId: proPlan._id,
      status: 'active',
      billingCycle: 'monthly',
      amount: 999,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    apexTenant.subscriptionId = apexSub._id;
    await apexTenant.save();

    await Membership.create([
      {
        userId: apexOwner._id,
        tenantId: apexTenant._id,
        role: 'owner',
        assignedStoreIds: [apexStore._id],
        status: 'active',
      },
      {
        userId: apexCashier._id,
        tenantId: apexTenant._id,
        role: 'cashier',
        assignedStoreIds: [apexStore._id],
        status: 'active',
      },
    ]);

    // 4. Seed Products matching exact items in screenshots
    const sampleProducts = [
      {
        name: 'Maggi Noodles',
        brand: 'Nestle',
        category: 'Snacks',
        sellingPrice: 12,
        costPrice: 9,
        stock: 50,
        lowStockThreshold: 5,
        expiryDate: new Date('2026-10-12'),
        barcode: '8901058852372',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Coca Cola',
        brand: 'Coca Cola',
        category: 'Beverages',
        sellingPrice: 40,
        costPrice: 30,
        stock: 30,
        lowStockThreshold: 10,
        expiryDate: new Date('2026-11-15'),
        barcode: '5449000000996',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Lays Classic',
        brand: 'Lays',
        category: 'Snacks',
        sellingPrice: 20,
        costPrice: 15,
        stock: 25,
        lowStockThreshold: 8,
        expiryDate: new Date('2026-11-10'),
        barcode: '8901491101837',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Amul Milk',
        brand: 'Amul',
        category: 'Dairy',
        sellingPrice: 28,
        costPrice: 24,
        stock: 12,
        lowStockThreshold: 15,
        expiryDate: new Date('2026-10-18'),
        barcode: '8901262010052',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Parle-G',
        brand: 'Parle',
        category: 'Biscuits',
        sellingPrice: 10,
        costPrice: 7,
        stock: 100,
        lowStockThreshold: 20,
        expiryDate: new Date('2026-12-25'),
        barcode: '8901719101018',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Britannia Bread',
        brand: 'Britannia',
        category: 'Bakery',
        sellingPrice: 35,
        costPrice: 28,
        stock: 5,
        lowStockThreshold: 8,
        expiryDate: new Date('2026-10-25'),
        barcode: '8901063131012',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Sunfeast Cookies',
        brand: 'Sunfeast',
        category: 'Biscuits',
        sellingPrice: 25,
        costPrice: 19,
        stock: 18,
        lowStockThreshold: 10,
        expiryDate: new Date('2026-11-20'),
        barcode: '8901725131024',
        image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Sprite',
        brand: 'Coca Cola',
        category: 'Beverages',
        sellingPrice: 40,
        costPrice: 31,
        stock: 45,
        lowStockThreshold: 10,
        expiryDate: new Date('2026-12-22'),
        barcode: '5449000011527',
        image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Dairy Milk',
        brand: 'Cadbury',
        category: 'Chocolates',
        sellingPrice: 60,
        costPrice: 48,
        stock: 8,
        lowStockThreshold: 12,
        expiryDate: new Date('2026-10-28'),
        barcode: '7622210817024',
        image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Tide Detergent',
        brand: 'Tide',
        category: 'Household',
        sellingPrice: 120,
        costPrice: 95,
        stock: 20,
        lowStockThreshold: 5,
        expiryDate: new Date('2026-11-30'),
        barcode: '4902430752101',
        image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=200&q=80',
      },
    ];

    const createdProducts = await Product.insertMany(
      sampleProducts.map((p) => ({
        ...p,
        tenantId: apexTenant._id,
        storeId: apexStore._id,
      }))
    );
    console.log('[Seed] Created Products');

    // 5. Create Customers
    const customers = await Customer.insertMany([
      {
        tenantId: apexTenant._id,
        name: 'Rahul Mehta',
        phone: '9876543210',
        email: 'rahul.mehta@gmail.com',
        customerType: 'Walk-in Customer',
        totalSpend: 1565,
        orderCount: 3,
        address: '123, MG Road, Koramangala, Bangalore - 560034',
      },
      {
        tenantId: apexTenant._id,
        name: 'Sneha Kapoor',
        phone: '9876543211',
        email: 'sneha.kapoor@example.com',
        customerType: 'Regular',
        totalSpend: 903,
        orderCount: 2,
        address: '45 Palm Grove, Indiranagar, Bangalore - 560038',
      },
      {
        tenantId: apexTenant._id,
        name: 'Arjun Singh',
        phone: '9876543212',
        email: 'arjun.singh@example.com',
        customerType: 'VIP',
        totalSpend: 2212,
        orderCount: 4,
        address: '78 HAL 2nd Stage, Bangalore - 560008',
      },
      {
        tenantId: apexTenant._id,
        name: 'Priya Sharma',
        phone: '9876543213',
        email: 'priya.sharma@example.com',
        customerType: 'Regular',
        totalSpend: 320,
        orderCount: 1,
        address: '12 Brigade Road, Bangalore - 560025',
      },
    ]);

    // 6. Create Initial Bill #1001 matching the screenshot
    const maggi = createdProducts.find((p) => p.name === 'Maggi Noodles');
    const coke = createdProducts.find((p) => p.name === 'Coca Cola');
    const lays = createdProducts.find((p) => p.name === 'Lays Classic');
    const milk = createdProducts.find((p) => p.name === 'Amul Milk');

    const bill1001Items = [
      { productId: maggi._id, name: maggi.name, brand: maggi.brand, price: 12, costPrice: 9, quantity: 2, total: 24, image: maggi.image },
      { productId: coke._id, name: coke.name, brand: coke.brand, price: 40, costPrice: 30, quantity: 1, total: 40, image: coke.image },
      { productId: lays._id, name: lays.name, brand: lays.brand, price: 20, costPrice: 15, quantity: 1, total: 20, image: lays.image },
      { productId: milk._id, name: milk.name, brand: milk.brand, price: 28, costPrice: 24, quantity: 1, total: 28, image: milk.image },
    ];

    await Sale.create({
      tenantId: apexTenant._id,
      storeId: apexStore._id,
      billNumber: '#1001',
      sequenceNumber: 1001,
      customerId: customers[0]._id,
      customerName: 'Rahul Mehta',
      customerPhone: '9876543210',
      customerType: 'Walk-in Customer',
      cashierName: 'Admin',
      items: bill1001Items,
      subtotal: 112,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      totalAmount: 112,
      paymentMethod: 'Cash',
      paymentStatus: 'paid',
      cogs: 87,
      grossProfit: 25,
      notes: '',
      billFormat: 'A4 - Standard',
      barcode: '#1001-15092026',
    });

    // 7. Create Online Orders matching the screenshot
    const sampleOrders = [
      {
        orderNumber: '#ORD1001',
        sequenceNumber: 1001,
        customer: {
          name: 'Rahul Mehta',
          phone: '+91 9876543210',
          email: 'rahul.mehta@gmail.com',
          deliveryAddress: '123, MG Road, Koramangala, Bangalore - 560034',
        },
        items: [
          { productId: maggi._id, name: 'Maggi Noodles', image: maggi.image, price: 12, quantity: 2, total: 24 },
          { productId: coke._id, name: 'Coca Cola', image: coke.image, price: 40, quantity: 1, total: 40 },
          { productId: lays._id, name: 'Lays Classic', image: lays.image, price: 20, quantity: 1, total: 20 },
        ],
        subtotal: 84,
        deliveryCharges: 30,
        discount: 0,
        totalAmount: 1245,
        paymentMethod: 'UPI',
        paymentStatus: 'paid',
        orderStatus: 'Delivered',
      },
      {
        orderNumber: '#ORD1002',
        sequenceNumber: 1002,
        customer: {
          name: 'Sneha Kapoor',
          phone: '+91 9876543211',
          email: 'sneha@example.com',
          deliveryAddress: '45 Palm Grove, Indiranagar, Bangalore',
        },
        items: [
          { productId: coke._id, name: 'Coca Cola', image: coke.image, price: 40, quantity: 2, total: 80 },
        ],
        subtotal: 80,
        totalAmount: 623,
        paymentMethod: 'Card',
        paymentStatus: 'paid',
        orderStatus: 'Shipped',
      },
      {
        orderNumber: '#ORD1003',
        sequenceNumber: 1003,
        customer: {
          name: 'Arjun Singh',
          phone: '+91 9876543212',
          email: 'arjun@example.com',
          deliveryAddress: '78 HAL 2nd Stage, Bangalore',
        },
        items: [
          { productId: lays._id, name: 'Lays Classic', image: lays.image, price: 20, quantity: 4, total: 80 },
        ],
        subtotal: 80,
        totalAmount: 1892,
        paymentMethod: 'Cash',
        paymentStatus: 'pending',
        orderStatus: 'Pending',
      },
      {
        orderNumber: '#ORD1004',
        sequenceNumber: 1004,
        customer: {
          name: 'Priya Sharma',
          phone: '+91 9876543213',
          email: 'priya@example.com',
          deliveryAddress: '12 Brigade Road, Bangalore',
        },
        items: [
          { productId: milk._id, name: 'Amul Milk', image: milk.image, price: 28, quantity: 1, total: 28 },
        ],
        subtotal: 28,
        totalAmount: 320,
        paymentMethod: 'UPI',
        paymentStatus: 'paid',
        orderStatus: 'Delivered',
      },
      {
        orderNumber: '#ORD1005',
        sequenceNumber: 1005,
        customer: {
          name: 'Amit Verma',
          phone: '+91 9876543214',
          email: 'amit@example.com',
          deliveryAddress: '56 Residency Road, Bangalore',
        },
        items: [
          { productId: maggi._id, name: 'Maggi Noodles', image: maggi.image, price: 12, quantity: 5, total: 60 },
        ],
        subtotal: 60,
        totalAmount: 900,
        paymentMethod: 'Card',
        paymentStatus: 'paid',
        orderStatus: 'Shipped',
      },
      {
        orderNumber: '#ORD1006',
        sequenceNumber: 1006,
        customer: {
          name: 'Neha Iyer',
          phone: '+91 9876543215',
          email: 'neha@example.com',
          deliveryAddress: '89 Richmond Town, Bangalore',
        },
        items: [
          { productId: coke._id, name: 'Coca Cola', image: coke.image, price: 40, quantity: 2, total: 80 },
        ],
        subtotal: 80,
        totalAmount: 645,
        paymentMethod: 'UPI',
        paymentStatus: 'failed',
        orderStatus: 'Cancelled',
      },
      {
        orderNumber: '#ORD1007',
        sequenceNumber: 1007,
        customer: {
          name: 'Karan Malhotra',
          phone: '+91 9876543216',
          email: 'karan@example.com',
          deliveryAddress: '14 Cunningham Road, Bangalore',
        },
        items: [
          { productId: lays._id, name: 'Lays Classic', image: lays.image, price: 20, quantity: 2, total: 40 },
        ],
        subtotal: 40,
        totalAmount: 2340,
        paymentMethod: 'Card',
        paymentStatus: 'paid',
        orderStatus: 'Delivered',
      },
      {
        orderNumber: '#ORD1008',
        sequenceNumber: 1008,
        customer: {
          name: 'Pooja Nair',
          phone: '+91 9876543217',
          email: 'pooja@example.com',
          deliveryAddress: '33 Lavelle Road, Bangalore',
        },
        items: [
          { productId: milk._id, name: 'Amul Milk', image: milk.image, price: 28, quantity: 2, total: 56 },
        ],
        subtotal: 56,
        totalAmount: 180,
        paymentMethod: 'Cash',
        paymentStatus: 'pending',
        orderStatus: 'Pending',
      },
    ];

    await Order.insertMany(
      sampleOrders.map((o) => ({
        ...o,
        tenantId: apexTenant._id,
        storeId: apexStore._id,
      }))
    );
    console.log('[Seed] Created Sample Online Orders');

    // 8. Create Demo Tenant 2 (GreenMart Organics - for verifying multi-tenant isolation!)
    const greenOwner = await User.create({
      name: 'Pooja Patel',
      email: 'pooja@greenmart.com',
      password: 'password123',
      phone: '9876599999',
      role: 'merchant_user',
    });

    const greenTenant = await Tenant.create({
      name: 'GreenMart Organics',
      slug: 'greenmart-organics',
      ownerId: greenOwner._id,
      status: 'active',
      planId: proPlan._id,
      currency: 'INR',
      contactPhone: '9876599999',
      contactEmail: 'pooja@greenmart.com',
    });

    const greenStore = await Store.create({
      tenantId: greenTenant._id,
      name: 'GreenMart - Whitefield',
      slug: 'greenmart-whitefield',
      phone: '9876599999',
      email: 'pooja@greenmart.com',
      isPrimary: true,
      address: {
        street: '88 Tech Park Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India',
      },
    });

    await Membership.create({
      userId: greenOwner._id,
      tenantId: greenTenant._id,
      role: 'owner',
      assignedStoreIds: [greenStore._id],
      status: 'active',
    });

    // GreenMart isolated products (Organic Apples, Almond Milk)
    await Product.insertMany([
      {
        tenantId: greenTenant._id,
        storeId: greenStore._id,
        name: 'Organic Shimla Apples (1kg)',
        brand: 'Organic Farm',
        category: 'Fruits',
        sellingPrice: 180,
        costPrice: 120,
        stock: 35,
        barcode: '890999900001',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=200&q=80',
      },
      {
        tenantId: greenTenant._id,
        storeId: greenStore._id,
        name: 'Unsweetened Almond Milk (1L)',
        brand: 'Almond Breeze',
        category: 'Dairy-Free',
        sellingPrice: 290,
        costPrice: 210,
        stock: 14,
        barcode: '890999900002',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80',
      },
    ]);
    console.log('[Seed] Created Isolated Tenant 2 (GreenMart)');

    console.log('--------------------------------------------------');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('Credentials:');
    console.log('1. Platform Admin: admin@mystore.com / admin123');
    console.log('2. Apex Supermarket Owner: rahul@apexretail.com / password123');
    console.log('3. Apex Cashier: sneha@apexretail.com / password123');
    console.log('4. GreenMart Owner: pooja@greenmart.com / password123');
    console.log('--------------------------------------------------');

    return true;
  } catch (error) {
    console.error('[Seed Error]:', error);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
