import mongoose from 'mongoose';

const moduleActionSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    reject: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    import: { type: Boolean, default: false },
    assign: { type: Boolean, default: false },
    transfer: { type: Boolean, default: false },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    parentBusiness: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED'],
      default: 'ACTIVE',
      index: true,
    },
    permissions: {
      products: { type: moduleActionSchema, default: () => ({}) },
      inventory: { type: moduleActionSchema, default: () => ({}) },
      orders: { type: moduleActionSchema, default: () => ({}) },
      users: { type: moduleActionSchema, default: () => ({}) },
      reports: { type: moduleActionSchema, default: () => ({}) },
      revenue: { type: moduleActionSchema, default: () => ({}) },
      roles: { type: moduleActionSchema, default: () => ({}) },
      audit: { type: moduleActionSchema, default: () => ({}) },
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

roleSchema.index({ parentBusiness: 1, roleName: 1 }, { unique: true });

export const Role = mongoose.model('Role', roleSchema);
