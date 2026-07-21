import { RevenueTransaction } from '../model/RevenueTransaction.js';

export class RevenueService {
  async getBusinessRevenue(currentUser, options = {}) {
    const query = { businessId: currentUser._id };
    const items = await RevenueTransaction.find(query)
      .populate('sourceUserId', 'firstName lastName email')
      .populate('productId', 'productName sku sellingPrice')
      .sort({ createdAt: -1 })
      .exec();

    const totalRevenue = items.reduce((sum, item) => sum + item.amount, 0);

    return { items, totalRevenue };
  }
}
