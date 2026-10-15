import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    priceMonthly: {
      type: Number,
      required: true,
      default: 0,
    },
    priceAnnual: {
      type: Number,
      required: true,
      default: 0,
    },
    features: [
      {
        type: String,
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
  { timestamps: true }
);

export default mongoose.model('Plan', planSchema);
