import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: 'General',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      index: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      index: true,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    expiryDate: {
      type: Date,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, barcode: 1 });
productSchema.index({ tenantId: 1, name: 'text', brand: 'text', category: 'text' });

export default mongoose.model('Product', productSchema);
