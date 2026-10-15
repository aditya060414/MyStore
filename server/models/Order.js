import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  total: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
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
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: '' },
      deliveryAddress: { type: String, default: '' },
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    deliveryCharges: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'Cash'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'failed'],
      default: 'paid',
    },
    orderStatus: {
      type: String,
      enum: ['Delivered', 'Shipped', 'Pending', 'Processing', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

orderSchema.index({ tenantId: 1, sequenceNumber: -1 });
orderSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);
