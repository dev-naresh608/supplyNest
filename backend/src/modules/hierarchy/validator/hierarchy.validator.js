import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

export const createChildSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  userType: z.enum([SYSTEM_USER_TYPES.BUSINESS, SYSTEM_USER_TYPES.STAFF]).optional(),
  role: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export const transferChildSchema = z.object({
  newParentId: z.string().min(24, 'Invalid target parent ID'),
});

export const validateHierarchyReq = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    next(ApiError.badRequest('Validation error', errorMessages));
  }
};
