import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    handle: {
      type: String,
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    priceMonthly: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    priceAnnual: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    trialDays: {
      type: Number,
      default: 0,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    limits: {
      maxStores: { type: Number, default: 1 },
      maxProducts: { type: Number, default: 50 },
      maxStaff: { type: Number, default: 1 },
      onlineStorefront: { type: Boolean, default: false },
      advancedReports: { type: Boolean, default: false },
      qrStoreSharing: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      customDomain: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

planSchema.pre('save', function () {
  if (!this.handle && this.slug) this.handle = this.slug;
  if (!this.slug && this.handle) this.slug = this.handle;
});

planSchema.virtual('planKey').get(function () {
  return this.handle || this.slug;
});

export default mongoose.model('Plan', planSchema);

