import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, required: true },
    isSuccess: { type: Boolean, required: true },
    failureReason: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
