import { NotificationService } from '../service/notification.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

export class NotificationController {
  constructor() {
    this.service = new NotificationService();
  }

  getNotifications = async (req, res, next) => {
    try {
      const result = await this.service.getUserNotifications(req.user._id, req.query);
      return ApiResponse.success(res, 'Notifications fetched successfully', result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req, res, next) => {
    try {
      const result = await this.service.getUnreadCount(req.user._id);
      return ApiResponse.success(res, 'Unread count fetched', result);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;
      const notification = await this.service.markAsRead(req.user._id, id);
      return ApiResponse.success(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req, res, next) => {
    try {
      const { category } = req.body || {};
      const result = await this.service.markAllAsRead(req.user._id, category);
      return ApiResponse.success(res, 'All notifications marked as read', result);
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteNotification(req.user._id, id);
      return ApiResponse.success(res, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  clearReadNotifications = async (req, res, next) => {
    try {
      const result = await this.service.clearAllRead(req.user._id);
      return ApiResponse.success(res, `${result.deletedCount} read notification(s) cleared`, result);
    } catch (error) {
      next(error);
    }
  };
}
