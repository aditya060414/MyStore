import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    address: {
      street: { type: String, default: '123 Market Street' },
      city: { type: String, default: 'Bangalore' },
      state: { type: String, default: 'Karnataka' },
      postalCode: { type: String, default: '560001' },
      country: { type: String, default: 'India' },
    },
    phone: {
      type: String,
      default: '9876543210',
    },
    email: {
      type: String,
      default: 'mystore@gmail.com',
    },
    isPrimary: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    storefrontEnabled: {
      type: Boolean,
      default: true,
    },
    storefrontBanner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    },
    storefrontDescription: {
      type: String,
      default: 'Your one-stop daily essentials, groceries, beverages and snacks store.',
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness within tenant
storeSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export default mongoose.model('Store', storeSchema);
