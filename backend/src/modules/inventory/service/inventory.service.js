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
    if (quantity <= 0) {
      throw ApiError.badRequest('Quantity must be greater than 0');
    }

    const isSuperAdmin = currentUser.userType === SYSTEM_USER_TYPES.SUPER_ADMIN;
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;

    // Non-SuperAdmin users CANNOT adjust stock directly - they must submit an approval request
    if (!isSuperAdmin) {
      if (type === STOCK_TRANSACTION_TYPES.STOCK_IN) {
        throw ApiError.forbidden('Only Super Admin can execute master Stock In');
      }

      // Check if user currently holds the required stock for deductions/damages
      if (type === STOCK_TRANSACTION_TYPES.DAMAGE || type === STOCK_TRANSACTION_TYPES.STOCK_OUT) {
        const currentStock = await this.inventoryRepo.findStock(ownerId, productId);
        if (!currentStock || currentStock.availableQty < quantity) {
          const available = currentStock ? currentStock.availableQty : 0;
          throw ApiError.badRequest(`Insufficient stock available for adjustment request. Current available: ${available}`);
        }
      }

      const request = await this.inventoryRepo.createAdjustmentRequest({
        requesterId: ownerId,
        productId,
        quantity,
        type,
        reason: notes,
      });

      return {
        isPendingApproval: true,
        message: 'Stock adjustment request submitted successfully and is awaiting Super Admin authorization.',
        request,
      };
    }

    // Direct Adjustment for Super Admin
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
      notes: notes || 'Direct adjustment by Super Admin',
      performedBy: currentUser._id,
    });

    return { isPendingApproval: false, stock: updatedStock, transaction };
  }

  async getAdjustmentRequests(currentUser, queryParams = {}) {
    const isSuperAdmin = currentUser.userType === SYSTEM_USER_TYPES.SUPER_ADMIN;
    const filter = {};

    if (!isSuperAdmin) {
      const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
      filter.requesterId = ownerId;
    }

    if (queryParams.status) {
      filter.status = queryParams.status;
    }

    return await this.inventoryRepo.getAdjustmentRequests(filter, queryParams);
  }

  async reviewAdjustmentRequest(superAdminUser, requestId, action, reviewNotes = '') {
    if (superAdminUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can review and authorize stock adjustments');
    }

    const request = await this.inventoryRepo.findAdjustmentRequestById(requestId);
    if (!request) {
      throw ApiError.notFound('Stock adjustment request not found');
    }

    if (request.status !== 'PENDING') {
      throw ApiError.badRequest(`This request has already been ${request.status.toLowerCase()}`);
    }

    if (action === 'REJECT') {
      return await this.inventoryRepo.updateAdjustmentRequest(requestId, {
        status: 'REJECTED',
        reviewedBy: superAdminUser._id,
        reviewNotes: reviewNotes || 'Rejected by Super Admin',
        reviewedAt: new Date(),
      });
    }

    if (action !== 'APPROVE') {
      throw ApiError.badRequest('Invalid review action. Allowed: APPROVE, REJECT');
    }

    // Apply stock adjustment on approval
    const requesterId = request.requesterId._id || request.requesterId;
    const productId = request.productId._id || request.productId;
    const quantity = request.quantity;
    const type = request.type;

    let deltaAvailable = 0;
    let deltaDamaged = 0;

    if (type === STOCK_TRANSACTION_TYPES.STOCK_IN || type === STOCK_TRANSACTION_TYPES.CORRECTION) {
      deltaAvailable = quantity;
    } else if (type === STOCK_TRANSACTION_TYPES.DAMAGE) {
      deltaAvailable = -quantity;
      deltaDamaged = quantity;
    } else if (type === STOCK_TRANSACTION_TYPES.ADJUSTMENT) {
      deltaAvailable = quantity;
    } else if (type === STOCK_TRANSACTION_TYPES.RETURN) {
      deltaAvailable = -quantity;
    }

    const currentStock = await this.inventoryRepo.findStock(requesterId, productId);
    if (deltaAvailable < 0 && (!currentStock || currentStock.availableQty < Math.abs(deltaAvailable))) {
      const available = currentStock ? currentStock.availableQty : 0;
      throw ApiError.badRequest(
        `Cannot approve: requester only has ${available} available units (required: ${Math.abs(deltaAvailable)})`
      );
    }

    // Atomic Stock Update
    await this.inventoryRepo.upsertStock(requesterId, productId, deltaAvailable, 0, deltaDamaged);

    // Log Immutable Transaction
    await this.inventoryRepo.createTransaction({
      productId,
      fromOwnerId: deltaAvailable < 0 ? requesterId : null,
      toOwnerId: deltaAvailable > 0 ? requesterId : null,
      quantity: Math.abs(quantity),
      transactionType: type,
      notes: `[Approved by Super Admin] ${request.reason || ''} ${reviewNotes ? `(${reviewNotes})` : ''}`.trim(),
      performedBy: superAdminUser._id,
    });

    // Update Request status
    return await this.inventoryRepo.updateAdjustmentRequest(requestId, {
      status: 'APPROVED',
      reviewedBy: superAdminUser._id,
      reviewNotes,
      reviewedAt: new Date(),
    });
  }

  async getNetworkStock(superAdminUser, options = {}) {
    if (superAdminUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can view global network stock distribution');
    }
    return await this.inventoryRepo.getNetworkStock(options);
  }

  async getMyInventory(currentUser, options) {
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
    return await this.inventoryRepo.getInventoryForOwner(ownerId, options);
  }

  async getTransactionHistory(currentUser, options) {
    const isSuperAdmin = currentUser.userType === SYSTEM_USER_TYPES.SUPER_ADMIN;
    if (isSuperAdmin) {
      return await this.inventoryRepo.getAllTransactionHistory(options);
    }
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
    return await this.inventoryRepo.getTransactionHistory(ownerId, options);
  }

  async getLowStockAlerts(currentUser) {
    const ownerId = currentUser.userType === SYSTEM_USER_TYPES.STAFF ? currentUser.parentUser : currentUser._id;
    return await this.inventoryRepo.getLowStockAlerts(ownerId);
  }
}
