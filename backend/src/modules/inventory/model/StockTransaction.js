import mongoose from 'mongoose';
import { STOCK_TRANSACTION_TYPES } from '../../../constants/userRoles.js';

const stockTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    fromOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    toOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    quantity: { type: Number, required: true, min: 1 },

    transactionType: {
      type: String,
      enum: Object.values(STOCK_TRANSACTION_TYPES),
      required: true,
      index: true,
    },
    referenceNumber: { type: String, default: '' },
    notes: { type: String, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
