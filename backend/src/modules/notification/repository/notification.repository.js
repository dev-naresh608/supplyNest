import { Notification } from '../model/Notification.js';

export class NotificationRepository {
  async create(data) {
    return await Notification.create(data);
  }

  async createMany(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];
    return await Notification.insertMany(dataArray);
  }

  async findByUser(userId, filter = {}, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { recipient: userId, ...filter };

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'firstName lastName email userType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    };
  }

  async countUnread(userId) {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
  }

  async markAsRead(userId, notificationId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );
  }

  async markAllAsRead(userId, category = null) {
    const filter = { recipient: userId, isRead: false };
    if (category) {
      filter.category = category;
    }
    const result = await Notification.updateMany(filter, {
      $set: { isRead: true, readAt: new Date() },
    });
    return result.modifiedCount;
  }

  async delete(userId, notificationId) {
    return await Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
  }

  async clearAllRead(userId) {
    const result = await Notification.deleteMany({ recipient: userId, isRead: true });
    return result.deletedCount;
  }
}
