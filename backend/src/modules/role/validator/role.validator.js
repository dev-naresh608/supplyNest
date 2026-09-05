import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

export const createRoleSchema = z.object({
  roleName: z.string().min(2, 'Role name is required'),
  description: z.string().optional(),
  permissions: z.record(z.any()).optional(),
});

export const cloneRoleSchema = z.object({
  newRoleName: z.string().min(2, 'New role name is required'),
});

export const assignRoleSchema = z.object({
  staffUserId: z.string().min(24, 'Invalid staff user ID'),
  roleId: z.string().min(24, 'Invalid role ID'),
});

export const validateRoleReq = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    const message = errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation error';
    next(ApiError.badRequest(message, errorMessages));
  }
};
