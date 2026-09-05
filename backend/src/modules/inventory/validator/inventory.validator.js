import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';
import { STOCK_TRANSACTION_TYPES } from '../../../constants/userRoles.js';

export const assignStockSchema = z.object({
  childId: z.string().min(24, 'Valid target child business ID required'),
  productId: z.string().min(24, 'Valid product ID required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  notes: z.string().optional(),
});

export const adjustStockSchema = z.object({
  productId: z.string().min(24, 'Valid product ID required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  type: z.enum([
    STOCK_TRANSACTION_TYPES.STOCK_IN,
    STOCK_TRANSACTION_TYPES.DAMAGE,
    STOCK_TRANSACTION_TYPES.CORRECTION,
    STOCK_TRANSACTION_TYPES.ADJUSTMENT,
  ]),
  notes: z.string().optional(),
});

export const validateInventoryReq = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    const message = errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation error';
    next(ApiError.badRequest(message, errorMessages));
  }
};
