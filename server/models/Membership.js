import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'cashier', 'inventory_manager'],
      default: 'cashier',
    },
    assignedStoreIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'invited', 'revoked'],
      default: 'active',
    },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, businessId: 1 }, { unique: true });

export default mongoose.model('Membership', membershipSchema);
