import { RevenueTransaction } from '../model/RevenueTransaction.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

export class RevenueService {
  async getBusinessRevenue(currentUser, options = {}) {
    let query = {};

    if (currentUser.userType === SYSTEM_USER_TYPES.SUPER_ADMIN) {
      if (options.businessId) {
        query.businessId = options.businessId;
      }
    } else if (currentUser.userType === SYSTEM_USER_TYPES.STAFF) {
      query.businessId = currentUser.parentUser;
    } else {
      query.businessId = currentUser._id;
    }

    const items = await RevenueTransaction.find(query)
      .populate('sourceUserId', 'firstName lastName email')
      .populate('productId', 'productName sku sellingPrice')
      .sort({ createdAt: -1 })
      .exec();

    const totalRevenue = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    return { items, totalRevenue };
  }
}

