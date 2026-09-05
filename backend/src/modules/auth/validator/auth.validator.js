import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    const message = errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation error';
    next(ApiError.badRequest(message, errorMessages));
  }
};
