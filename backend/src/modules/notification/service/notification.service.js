import { NotificationRepository } from '../repository/notification.repository.js';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SEVERITIES,
} from '../model/Notification.js';
import { ApiError } from '../../../utils/ApiError.js';
import { logger } from '../../../utils/Logger.js';

export class NotificationService {
  constructor() {
    this.repo = new NotificationRepository();
  }

  async getUserNotifications(userId, queryParams = {}) {
    const filter = {};

    if (queryParams.isRead !== undefined && queryParams.isRead !== '') {
      filter.isRead = queryParams.isRead === 'true' || queryParams.isRead === true;
    }

    if (queryParams.category && queryParams.category !== 'ALL') {
      filter.category = queryParams.category;
    }

    if (queryParams.severity && queryParams.severity !== 'ALL') {
      filter.severity = queryParams.severity;
    }

    if (queryParams.search && queryParams.search.trim()) {
      const searchRegex = new RegExp(queryParams.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { message: searchRegex }];
    }

    return await this.repo.findByUser(userId, filter, {
      page: queryParams.page,
      limit: queryParams.limit,
    });
  }

  async getUnreadCount(userId) {
    const unreadCount = await this.repo.countUnread(userId);
    return { unreadCount };
  }

  async markAsRead(userId, notificationId) {
    const notification = await this.repo.markAsRead(userId, notificationId);
    if (!notification) {
      throw ApiError.notFound('Notification not found or access denied');
    }
    return notification;
  }

  async markAllAsRead(userId, category = null) {
    const modifiedCount = await this.repo.markAllAsRead(userId, category);
    return { modifiedCount };
  }

  async deleteNotification(userId, notificationId) {
    const deleted = await this.repo.delete(userId, notificationId);
    if (!deleted) {
      throw ApiError.notFound('Notification not found or access denied');
    }
    return { success: true, message: 'Notification deleted successfully' };
  }

  async clearAllRead(userId) {
    const deletedCount = await this.repo.clearAllRead(userId);
    return { deletedCount };
  }

  // --- Domain Notification Event Helpers ---

  async notifyStockAssigned({ sender, recipientId, productName, sku, quantity, notes }) {
    try {
      const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Upstream Partner';
      return await this.repo.create({
        recipient: recipientId,
        sender: sender ? sender._id : null,
        title: 'Stock Allocation Received',
        message: `${quantity} unit(s) of "${productName}" (SKU: ${sku}) were assigned to your warehouse by ${senderName}.${notes ? ` Note: "${notes}"` : ''}`,
        type: NOTIFICATION_TYPES.STOCK_ASSIGNMENT,
        category: NOTIFICATION_CATEGORIES.INVENTORY,
        severity: NOTIFICATION_SEVERITIES.SUCCESS,
        link: '/inventory',
        metadata: { productName, sku, quantity, notes, senderId: sender?._id },
      });
    } catch (err) {
      logger.error(`Failed to send notifyStockAssigned: ${err.message}`);
    }
  }

  async notifyAdjustmentRequested({ requester, superAdminIds, productName, sku, quantity, type, reason, requestId }) {
    try {
      const requesterName = requester ? `${requester.firstName} ${requester.lastName}`.trim() : 'Downline Business';
      const notifications = superAdminIds.map((adminId) => ({
        recipient: adminId,
        sender: requester ? requester._id : null,
        title: 'Stock Adjustment Request',
        message: `${requesterName} has requested a stock ${type} adjustment for ${quantity} unit(s) of "${productName}" (SKU: ${sku}). Reason: "${reason || 'No reason provided'}".`,
        type: NOTIFICATION_TYPES.STOCK_ADJUSTMENT_REQUEST,
        category: NOTIFICATION_CATEGORIES.APPROVALS,
        severity: NOTIFICATION_SEVERITIES.WARNING,
        link: '/inventory',
        metadata: { requestId, requesterId: requester?._id, productName, sku, quantity, type, reason },
      }));

      return await this.repo.createMany(notifications);
    } catch (err) {
      logger.error(`Failed to send notifyAdjustmentRequested: ${err.message}`);
    }
  }

  async notifyAdjustmentReviewed({ reviewer, requesterId, productName, sku, quantity, action, reviewNotes, requestId }) {
    try {
      const isApproved = action === 'APPROVE';
      const reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}`.trim() : 'Super Admin';

      return await this.repo.create({
        recipient: requesterId,
        sender: reviewer ? reviewer._id : null,
        title: isApproved ? 'Stock Adjustment Approved' : 'Stock Adjustment Rejected',
        message: `Your stock adjustment request for ${quantity} unit(s) of "${productName}" (SKU: ${sku}) was ${isApproved ? 'APPROVED' : 'REJECTED'} by ${reviewerName}.${reviewNotes ? ` Review note: "${reviewNotes}"` : ''}`,
        type: isApproved ? NOTIFICATION_TYPES.STOCK_ADJUSTMENT_APPROVED : NOTIFICATION_TYPES.STOCK_ADJUSTMENT_REJECTED,
        category: NOTIFICATION_CATEGORIES.APPROVALS,
        severity: isApproved ? NOTIFICATION_SEVERITIES.SUCCESS : NOTIFICATION_SEVERITIES.DANGER,
        link: '/inventory',
        metadata: { requestId, action, reviewerId: reviewer?._id, productName, sku, quantity, reviewNotes },
      });
    } catch (err) {
      logger.error(`Failed to send notifyAdjustmentReviewed: ${err.message}`);
    }
  }

  async notifyLowStockAlert({ ownerId, productName, sku, currentStock, minStockThreshold }) {
    try {
      return await this.repo.create({
        recipient: ownerId,
        sender: null,
        title: 'Low Stock Alert Warning',
        message: `Inventory balance for "${productName}" (SKU: ${sku}) has fallen to ${currentStock} unit(s), which is at or below the safety threshold of ${minStockThreshold}.`,
        type: NOTIFICATION_TYPES.LOW_STOCK_ALERT,
        category: NOTIFICATION_CATEGORIES.INVENTORY,
        severity: NOTIFICATION_SEVERITIES.WARNING,
        link: '/inventory',
        metadata: { productName, sku, currentStock, minStockThreshold },
      });
    } catch (err) {
      logger.error(`Failed to send notifyLowStockAlert: ${err.message}`);
    }
  }

  async notifyChildCreated({ creator, childId, childName, roleName }) {
    try {
      const creatorName = creator ? `${creator.firstName} ${creator.lastName}`.trim() : 'Administrator';
      return await this.repo.create({
        recipient: childId,
        sender: creator ? creator._id : null,
        title: 'Welcome to Invora Enterprise',
        message: `Your enterprise account "${childName}" has been successfully provisioned by ${creatorName} with role "${roleName}".`,
        type: NOTIFICATION_TYPES.CHILD_NODE_CREATED,
        category: NOTIFICATION_CATEGORIES.HIERARCHY,
        severity: NOTIFICATION_SEVERITIES.INFO,
        link: '/dashboard',
        metadata: { childId, roleName, creatorId: creator?._id },
      });
    } catch (err) {
      logger.error(`Failed to send notifyChildCreated: ${err.message}`);
    }
  }

  async notifyNodeTransferred({ childId, newParentId, childName, newParentName }) {
    try {
      const notifications = [
        {
          recipient: childId,
          title: 'Organization Transfer Completed',
          message: `Your business node has been transferred under upstream parent "${newParentName}".`,
          type: NOTIFICATION_TYPES.NODE_TRANSFERRED,
          category: NOTIFICATION_CATEGORIES.HIERARCHY,
          severity: NOTIFICATION_SEVERITIES.INFO,
          link: '/hierarchy',
          metadata: { newParentId, newParentName },
        },
        {
          recipient: newParentId,
          title: 'New Downline Node Attached',
          message: `Business node "${childName}" has been successfully transferred into your downline branch.`,
          type: NOTIFICATION_TYPES.NODE_TRANSFERRED,
          category: NOTIFICATION_CATEGORIES.HIERARCHY,
          severity: NOTIFICATION_SEVERITIES.SUCCESS,
          link: '/hierarchy',
          metadata: { childId, childName },
        },
      ];

      return await this.repo.createMany(notifications);
    } catch (err) {
      logger.error(`Failed to send notifyNodeTransferred: ${err.message}`);
    }
  }
}
