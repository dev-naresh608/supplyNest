import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = {
  STOCK_ASSIGNMENT: 'STOCK_ASSIGNMENT',
  STOCK_ADJUSTMENT_REQUEST: 'STOCK_ADJUSTMENT_REQUEST',
  STOCK_ADJUSTMENT_APPROVED: 'STOCK_ADJUSTMENT_APPROVED',
  STOCK_ADJUSTMENT_REJECTED: 'STOCK_ADJUSTMENT_REJECTED',
  LOW_STOCK_ALERT: 'LOW_STOCK_ALERT',
  CHILD_NODE_CREATED: 'CHILD_NODE_CREATED',
  NODE_TRANSFERRED: 'NODE_TRANSFERRED',
  SECURITY_ALERT: 'SECURITY_ALERT',
  SYSTEM: 'SYSTEM',
};

export const NOTIFICATION_CATEGORIES = {
  INVENTORY: 'INVENTORY',
  APPROVALS: 'APPROVALS',
  HIERARCHY: 'HIERARCHY',
  SECURITY: 'SECURITY',
  SYSTEM: 'SYSTEM',
};

export const NOTIFICATION_SEVERITIES = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  DANGER: 'DANGER',
};

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    category: {
      type: String,
      enum: Object.values(NOTIFICATION_CATEGORIES),
      default: NOTIFICATION_CATEGORIES.SYSTEM,
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(NOTIFICATION_SEVERITIES),
      default: NOTIFICATION_SEVERITIES.INFO,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal query speed on user notification feeds
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
