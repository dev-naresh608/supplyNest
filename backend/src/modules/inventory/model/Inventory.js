import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    availableQty: { type: Number, required: true, default: 0, min: 0 },
    reservedQty: { type: Number, required: true, default: 0, min: 0 },
    damagedQty: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },
  },
  { timestamps: true }
);

inventorySchema.index({ ownerId: 1, productId: 1 }, { unique: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
