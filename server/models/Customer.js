import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['Walk-in Customer', 'Regular', 'Wholesale', 'VIP'],
      default: 'Walk-in Customer',
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

customerSchema.index({ tenantId: 1, phone: 1 });

export default mongoose.model('Customer', customerSchema);
