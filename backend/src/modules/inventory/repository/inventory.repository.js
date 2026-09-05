import { Inventory } from '../model/Inventory.js';
import { StockTransaction } from '../model/StockTransaction.js';
import { StockAdjustmentRequest } from '../model/StockAdjustmentRequest.js';
import { Category, Brand } from '../../product/model/Category.js';
import { Product } from '../../product/model/Product.js';
import { User } from '../../auth/model/User.js';

export class InventoryRepository {
  async findStock(ownerId, productId) {
    return await Inventory.findOne({ ownerId, productId });
  }

  async getInventoryForOwner(ownerId, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { ownerId };
    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate({
          path: 'productId',
          select: 'productName sku category brand sellingPrice primaryImage',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'brand', select: 'name' },
          ],
        })
        .skip(skip)
        .limit(limit)
        .exec(),
      Inventory.countDocuments(query),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getNetworkStock(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ availableQty: { $gt: 0 } }, { reservedQty: { $gt: 0 } }, { damagedQty: { $gt: 0 } }],
    };

    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate({
          path: 'ownerId',
          select: 'firstName lastName email userType hierarchyLevel ancestorPath',
        })
        .populate({
          path: 'productId',
          select: 'productName sku category brand sellingPrice primaryImage',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'brand', select: 'name' },
          ],
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Inventory.countDocuments(query),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async upsertStock(ownerId, productId, deltaAvailable, deltaReserved = 0, deltaDamaged = 0, session = null) {
    const opts = session ? { session, new: true, upsert: true } : { new: true, upsert: true };
    const query = { ownerId, productId };

    if (deltaAvailable < 0) {
      query.availableQty = { $gte: Math.abs(deltaAvailable) };
      opts.upsert = false;
    }

    const updated = await Inventory.findOneAndUpdate(
      query,
      {
        $inc: {
          availableQty: deltaAvailable,
          reservedQty: deltaReserved,
          damagedQty: deltaDamaged,
        },
      },
      opts
    );

    if (!updated && deltaAvailable < 0) {
      throw new Error('Insufficient stock available for atomic operation');
    }

    return updated;
  }

  async createTransaction(transactionData, session = null) {
    const opts = session ? { session } : {};
    const [transaction] = await StockTransaction.create([transactionData], opts);
    return transaction;
  }

  async getTransactionHistory(ownerId, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { $or: [{ fromOwnerId: ownerId }, { toOwnerId: ownerId }] };

    const [items, total] = await Promise.all([
      StockTransaction.find(query)
        .populate('productId', 'productName sku primaryImage')
        .populate('fromOwnerId', 'firstName lastName email userType')
        .populate('toOwnerId', 'firstName lastName email userType')
        .populate('performedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      StockTransaction.countDocuments(query),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getAllTransactionHistory(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      StockTransaction.find({})
        .populate('productId', 'productName sku primaryImage')
        .populate('fromOwnerId', 'firstName lastName email userType')
        .populate('toOwnerId', 'firstName lastName email userType')
        .populate('performedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      StockTransaction.countDocuments({}),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getLowStockAlerts(ownerId) {
    return await Inventory.find({ ownerId })
      .where('availableQty')
      .lte(10)
      .populate('productId', 'productName sku primaryImage')
      .exec();
  }

  // Stock Adjustment Requests
  async createAdjustmentRequest(data) {
    return await StockAdjustmentRequest.create(data);
  }

  async findAdjustmentRequestById(id) {
    return await StockAdjustmentRequest.findById(id)
      .populate('requesterId', 'firstName lastName email userType hierarchyLevel')
      .populate('productId', 'productName sku')
      .populate('reviewedBy', 'firstName lastName email');
  }

  async getAdjustmentRequests(filter = {}, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      StockAdjustmentRequest.find(filter)
        .populate('requesterId', 'firstName lastName email userType hierarchyLevel')
        .populate('productId', 'productName sku')
        .populate('reviewedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      StockAdjustmentRequest.countDocuments(filter),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateAdjustmentRequest(id, updateData) {
    return await StockAdjustmentRequest.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('requesterId', 'firstName lastName email userType hierarchyLevel')
      .populate('productId', 'productName sku')
      .populate('reviewedBy', 'firstName lastName email');
  }
}
