import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['sale', 'online_order', 'restock', 'adjustment', 'return', 'initial'],
      required: true,
    },
    quantityDelta: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: '',
    },
    referenceId: {
      type: String,
      default: '',
    },
    performedBy: {
      type: String,
      default: 'System',
    },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('InventoryMovement', inventoryMovementSchema);
