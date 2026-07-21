import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from '../../../constants/userRoles.js';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    password: { type: String, required: true, select: false },
    profilePhoto: { type: String, default: '' },

    userType: {
      type: String,
      enum: Object.values(SYSTEM_USER_TYPES),
      default: SYSTEM_USER_TYPES.BUSINESS,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      required: true,
      index: true,
    },

    // Hierarchy Links (Materialized Path)
    parentUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    ancestorPath: { type: String, default: '', index: true }, // e.g. "SUPERADMIN_ID/PARENT_ID"
    hierarchyLevel: { type: Number, default: 0, index: true },

    // Role assignment (Dynamic Role for Staff or Business)
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLogin: { type: Date, default: null },

    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' },
    pincode: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
