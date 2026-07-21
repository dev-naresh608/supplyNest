import { Router } from 'express';
import { InventoryController } from '../controller/inventory.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';
import { checkPermission } from '../../role/middleware/permission.middleware.js';
import { validateInventoryReq, assignStockSchema, adjustStockSchema } from '../validator/inventory.validator.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

const router = Router();
const controller = new InventoryController();

router.use(protect);

router.get('/my-stock', checkPermission('inventory', 'view'), controller.getMyInventory);
router.get('/history', checkPermission('inventory', 'view'), controller.getHistory);
router.get('/alerts', checkPermission('inventory', 'view'), controller.getLowStockAlerts);

router.post(
  '/assign',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  validateInventoryReq(assignStockSchema),
  controller.assignStock
);

router.post(
  '/adjust',
  checkPermission('inventory', 'update'),
  validateInventoryReq(adjustStockSchema),
  controller.adjustStock
);

export default router;
