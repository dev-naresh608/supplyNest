import { Router } from 'express';
import { ProductController } from '../controller/product.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';
import { checkPermission } from '../../role/middleware/permission.middleware.js';
import { validateProductReq, createProductSchema } from '../validator/product.validator.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

const router = Router();
const controller = new ProductController();

router.use(protect);

router.post(
  '/',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN),
  validateProductReq(createProductSchema),
  controller.createProduct
);

router.get('/', checkPermission('products', 'view'), controller.getProducts);
router.get('/categories', controller.getCategories);
router.post('/categories', restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN), controller.createCategory);
router.get('/brands', controller.getBrands);
router.post('/brands', restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN), controller.createBrand);
router.get('/:id', checkPermission('products', 'view'), controller.getProductById);
router.put('/:id', restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN), controller.updateProduct);

export default router;
