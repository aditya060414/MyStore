import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Store name is required'],
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

storeSchema.pre('save', function () {
  if (!this.handle && this.slug) this.handle = this.slug;
  if (!this.slug && this.handle) this.slug = this.handle;
});

storeSchema.virtual('storeHandle').get(function () {
  return this.handle || this.slug;
});

// Compound index for uniqueness within business
storeSchema.index({ businessId: 1, slug: 1 }, { unique: true });
storeSchema.index({ businessId: 1, handle: 1 });

export default mongoose.model('Store', storeSchema);
