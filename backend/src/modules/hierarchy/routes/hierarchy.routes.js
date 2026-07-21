import { Router } from 'express';
import { HierarchyController } from '../controller/hierarchy.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';
import { validateHierarchyReq, createChildSchema, transferChildSchema } from '../validator/hierarchy.validator.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

const router = Router();
const controller = new HierarchyController();

router.use(protect);

router.post(
  '/children',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  validateHierarchyReq(createChildSchema),
  controller.createChildUser
);

router.get('/tree', controller.getTree);
router.get('/children', controller.getDirectChildren);
router.get('/downline', controller.getDownline);
router.get('/stats', controller.getStats);

router.patch(
  '/transfer/:id',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  validateHierarchyReq(transferChildSchema),
  controller.transferChild
);

router.delete(
  '/children/:id',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  controller.deleteChild
);

export default router;
