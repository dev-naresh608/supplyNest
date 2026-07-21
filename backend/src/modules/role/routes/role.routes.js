import { Router } from 'express';
import { RoleController } from '../controller/role.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';
import { checkPermission } from '../middleware/permission.middleware.js';
import { validateRoleReq, createRoleSchema, cloneRoleSchema, assignRoleSchema } from '../validator/role.validator.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

const router = Router();
const controller = new RoleController();

router.use(protect);

router.post(
  '/',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  validateRoleReq(createRoleSchema),
  controller.createRole
);

router.get('/', checkPermission('roles', 'view'), controller.getRoles);
router.get('/stats', checkPermission('roles', 'view'), controller.getStats);
router.get('/:id', checkPermission('roles', 'view'), controller.getRoleById);

router.put(
  '/:id',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  controller.updateRole
);

router.post(
  '/:id/clone',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  validateRoleReq(cloneRoleSchema),
  controller.cloneRole
);

router.post(
  '/assign',
  restrictTo(SYSTEM_USER_TYPES.SUPER_ADMIN, SYSTEM_USER_TYPES.BUSINESS),
  validateRoleReq(assignRoleSchema),
  controller.assignRole
);

export default router;
