import mongoose from 'mongoose';
import { STOCK_TRANSACTION_TYPES } from '../../../constants/userRoles.js';

export const ADJUSTMENT_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

const stockAdjustmentRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: [
        STOCK_TRANSACTION_TYPES.DAMAGE,
        STOCK_TRANSACTION_TYPES.ADJUSTMENT,
        STOCK_TRANSACTION_TYPES.CORRECTION,
        STOCK_TRANSACTION_TYPES.RETURN,
      ],
      required: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ADJUSTMENT_REQUEST_STATUS),
      default: ADJUSTMENT_REQUEST_STATUS.PENDING,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
      trim: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const StockAdjustmentRequest = mongoose.model(
  'StockAdjustmentRequest',
  stockAdjustmentRequestSchema
);
