import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    handle: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
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
    credits: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    extraStores: {
      type: Number,
      default: 0,
    },
    perks: [
      {
        type: String,
      },
    ],
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
      receiptHeader: { type: String, default: 'BisonMooves Store Retail' },
      receiptFooter: { type: String, default: 'Thank you for shopping with us! Visit again | BisonMooves Store' },
      enableLowStockAlerts: { type: Boolean, default: true },
      lowStockDefault: { type: Number, default: 5 },
      primaryColor: { type: String, default: '#2563eb' },
      logoUrl: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

businessSchema.pre('save', function (next) {
  if (!this.handle && this.slug) this.handle = this.slug;
  if (!this.slug && this.handle) this.slug = this.handle;
  next();
});

businessSchema.virtual('storeHandle').get(function () {
  return this.handle || this.slug;
});

export default mongoose.model('Business', businessSchema);
