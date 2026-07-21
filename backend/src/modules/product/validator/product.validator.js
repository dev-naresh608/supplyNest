import { z } from 'zod';
import { ApiError } from '../../../utils/ApiError.js';

export const createProductSchema = z.object({
  productName: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().optional(),
  category: z.string().min(24, 'Valid category ID required'),
  brand: z.string().min(24, 'Valid brand ID required'),
  description: z.string().optional(),
  costPrice: z.number().positive(),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  mrp: z.number().positive(),
  initialStockQty: z.number().nonnegative().optional(),
});

export const validateProductReq = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    next(ApiError.badRequest('Validation error', errorMessages));
  }
};
