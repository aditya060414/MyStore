import mongoose from 'mongoose';

const customerLedgerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    transactionType: {
      type: String,
      enum: ['Credit Sale', 'Sale', 'Payment Received', 'Refund', 'Adjustment', 'Opening Balance'],
      required: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
      // Amount owed by customer increases
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
      // Payment/Credit reducing amount owed
    },
    runningBalance: {
      type: Number,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['Sale', 'Order', 'CustomerPayment', 'Manual', 'Opening'],
      default: 'Sale',
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    notes: {
      type: String,
      default: '',
    },
    recordedBy: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: {
        type: String,
        default: 'System',
      },
    },
  },
  { timestamps: true }
);

customerLedgerSchema.index({ businessId: 1, customerId: 1, date: -1 });

export default mongoose.model('CustomerLedger', customerLedgerSchema);
