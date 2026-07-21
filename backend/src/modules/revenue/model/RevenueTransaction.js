import mongoose from 'mongoose';

const revenueTransactionSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    marginRate: { type: Number, required: true }, // e.g. 5%
    tierLevel: { type: Number, required: true },
    status: { type: String, enum: ['SETTLED', 'PENDING', 'CANCELLED'], default: 'SETTLED' },
    referenceId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const RevenueTransaction = mongoose.model('RevenueTransaction', revenueTransactionSchema);
