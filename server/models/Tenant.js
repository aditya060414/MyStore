import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'cancelled', 'suspended'],
      default: 'trialing',
      index: true,
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    country: {
      type: String,
      default: 'IN',
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    settings: {
      taxRate: { type: Number, default: 0 },
      taxName: { type: String, default: 'GST' },
      taxInclusive: { type: Boolean, default: false },
      invoicePrefix: { type: String, default: 'INV-' },
      billFormat: { type: String, default: 'A4 - Standard' },
      receiptHeader: { type: String, default: 'MyStore Retail' },
      receiptFooter: { type: String, default: 'Thank you for shopping with us! Visit again | MyStore' },
      enableLowStockAlerts: { type: Boolean, default: true },
      lowStockDefault: { type: Number, default: 5 },
      primaryColor: { type: String, default: '#2563eb' },
      logoUrl: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Tenant', tenantSchema);
