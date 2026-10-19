import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['free_trial', 'discount_percent', 'fixed_credit', 'free_lifetime'],
      default: 'free_trial',
    },
    value: {
      type: Number,
      default: 30, // 30 days or 100% or ₹500 credit
    },
    description: {
      type: String,
      default: '',
    },
    maxRedemptions: {
      type: Number,
      default: 100,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
    },
  },
  { timestamps: true }
);

export default mongoose.model('Promotion', promotionSchema);
