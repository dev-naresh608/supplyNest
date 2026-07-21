import { Router } from 'express';
import { RevenueController } from '../controller/revenue.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { checkPermission } from '../../role/middleware/permission.middleware.js';

const router = Router();
const controller = new RevenueController();

router.use(protect);
router.get('/', checkPermission('revenue', 'view'), controller.getRevenue);

export default router;
