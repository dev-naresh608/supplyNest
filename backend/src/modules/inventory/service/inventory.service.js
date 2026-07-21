import mongoose from 'mongoose';
import { InventoryRepository } from '../repository/inventory.repository.js';
import { User } from '../../auth/model/User.js';
import { ApiError } from '../../../utils/ApiError.js';
import { STOCK_TRANSACTION_TYPES, SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

export class InventoryService {
  constructor() {
    this.inventoryRepo = new InventoryRepository();
  }

  async assignStock(parentUser, childId, productId, quantity, notes = '') {
    if (quantity <= 0) throw ApiError.badRequest('Quantity must be greater than 0');

    const child = await User.findById(childId);
    if (!child || child.isDeleted) throw ApiError.notFound('Target child business not found');

    // Hierarchy validation: Child must belong to parent's downline
    const isDirectChild = child.parentUser.toString() === parentUser._id.toString();
    const isDownline = child.ancestorPath && child.ancestorPath.includes(parentUser._id.toString());
    const isSuperAdmin = parentUser.userType === SYSTEM_USER_TYPES.SUPER_ADMIN;

    if (!isDirectChild && !isDownline && !isSuperAdmin) {
      throw ApiError.forbidden('You can only assign inventory to child businesses within your downline hierarchy');
    }

    // Check parent stock
    const parentStock = await this.inventoryRepo.findStock(parentUser._id, productId);
    if (!parentStock || parentStock.availableQty < quantity) {
      const available = parentStock ? parentStock.availableQty : 0;
      throw ApiError.badRequest(`Insufficient stock available. Required: ${quantity}, Available: ${available}`);
    }

    let session = null;
    let useTransaction = true;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionErr) {
      useTransaction = false;
      if (session) session.endSession();
      session = null;
    }

    try {
      const activeSession = useTransaction ? session : null;

      // Deduct from parent
      await this.inventoryRepo.upsertStock(parentUser._id, productId, -quantity, 0, 0, activeSession);

      // Add to child
      await this.inventoryRepo.upsertStock(child._id, productId, quantity, 0, 0, activeSession);

      // Log transaction
      const transaction = await this.inventoryRepo.createTransaction(
        {
          productId,
          fromOwnerId: parentUser._id,
          toOwnerId: child._id,
          quantity,
          transactionType: STOCK_TRANSACTION_TYPES.ASSIGNMENT,
          notes,
          performedBy: parentUser._id,
        },
        activeSession
      );

      if (useTransaction && session) {
        await session.commitTransaction();
        session.endSession();
      }

      return transaction;
    } catch (err) {
      // Fallback for standalone MongoDB instances without replica set support
      if (err.message && err.message.includes('replica set member')) {
        if (useTransaction && session) {
          try {
            await session.abortTransaction();
            session.endSession();
          } catch (e) {}
        }

        // Sequential atomic operations without session
        await this.inventoryRepo.upsertStock(parentUser._id, productId, -quantity, 0, 0, null);
        await this.inventoryRepo.upsertStock(child._id, productId, quantity, 0, 0, null);
        return await this.inventoryRepo.createTransaction(
          {
            productId,
            fromOwnerId: parentUser._id,
            toOwnerId: child._id,
            quantity,
            transactionType: STOCK_TRANSACTION_TYPES.ASSIGNMENT,
            notes,
            performedBy: parentUser._id,
          },
          null
        );
      }

      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw err;
    }
  }

  async adjustStock(currentUser, productId, quantity, type, notes = '') {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN && type === STOCK_TRANSACTION_TYPES.STOCK_IN) {
      throw ApiError.forbidden('Only Super Admin can perform master Stock In');
    }

    let deltaAvailable = 0;
    let deltaDamaged = 0;

    if (type === STOCK_TRANSACTION_TYPES.STOCK_IN || type === STOCK_TRANSACTION_TYPES.CORRECTION) {
      deltaAvailable = quantity;
    } else if (type === STOCK_TRANSACTION_TYPES.DAMAGE) {
      deltaAvailable = -quantity;
      deltaDamaged = quantity;
    } else if (type === STOCK_TRANSACTION_TYPES.ADJUSTMENT) {
      deltaAvailable = quantity;
    }

    const currentStock = await this.inventoryRepo.findStock(currentUser._id, productId);
    if (deltaAvailable < 0 && (!currentStock || currentStock.availableQty < Math.abs(deltaAvailable))) {
      throw ApiError.badRequest('Cannot decrease stock below 0');
    }

    const updatedStock = await this.inventoryRepo.upsertStock(
      currentUser._id,
      productId,
      deltaAvailable,
      0,
      deltaDamaged
    );

    const transaction = await this.inventoryRepo.createTransaction({
      productId,
      fromOwnerId: deltaAvailable < 0 ? currentUser._id : null,
      toOwnerId: deltaAvailable > 0 ? currentUser._id : null,
      quantity: Math.abs(quantity),
      transactionType: type,
      notes,
      performedBy: currentUser._id,
    });

    return { stock: updatedStock, transaction };
  }

  async getMyInventory(currentUser, options) {
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
    return await this.inventoryRepo.getInventoryForOwner(ownerId, options);
  }

  async getTransactionHistory(currentUser, options) {
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
    return await this.inventoryRepo.getTransactionHistory(ownerId, options);
  }

  async getLowStockAlerts(currentUser) {
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
    return await this.inventoryRepo.getLowStockAlerts(ownerId);
  }
}
