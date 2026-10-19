import mongoose from 'mongoose';

const adCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ad campaign title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      default: 'Featured Store',
      trim: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    businessName: {
      type: String,
      default: '',
    },
    storeHandle: {
      type: String,
      default: '',
    },
    storeSlug: {
      type: String,
      default: '',
    },
    discountText: {
      type: String,
      default: '',
    },
    accentColor: {
      type: String,
      default: '#2563eb',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model('AdCampaign', adCampaignSchema);
