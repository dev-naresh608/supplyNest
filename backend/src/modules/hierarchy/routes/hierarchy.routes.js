import { Router } from 'express';
import { HierarchyController } from '../controller/hierarchy.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';
import { checkPermission } from '../../role/middleware/permission.middleware.js';
import { validateHierarchyReq, createChildSchema, transferChildSchema } from '../validator/hierarchy.validator.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

const router = Router();
const controller = new HierarchyController();

router.use(protect);

router.post(
  '/children',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  checkPermission('users', 'create'),
  validateHierarchyReq(createChildSchema),
  controller.createChildUser
);

router.get('/tree', checkPermission('users', 'view'), controller.getTree);
router.get('/children', checkPermission('users', 'view'), controller.getDirectChildren);
router.get('/downline', checkPermission('users', 'view'), controller.getDownline);
router.get('/stats', checkPermission('users', 'view'), controller.getStats);

router.patch(
  '/transfer/:id',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  checkPermission('users', 'update'),
  validateHierarchyReq(transferChildSchema),
  controller.transferChild
);

router.put(
  '/children/:id',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  checkPermission('users', 'update'),
  controller.updateChild
);

router.delete(
  '/children/:id',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  checkPermission('users', 'delete'),
  controller.deleteChild
);

export default router;


