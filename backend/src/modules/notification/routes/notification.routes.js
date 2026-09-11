import { Router } from 'express';
import { NotificationController } from '../controller/notification.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';

const router = Router();
const controller = new NotificationController();

// All notification routes are protected
router.use(protect);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/mark-all-read', controller.markAllAsRead);
router.delete('/clear-read', controller.clearReadNotifications);
router.patch('/:id/read', controller.markAsRead);
router.delete('/:id', controller.deleteNotification);

export default router;
