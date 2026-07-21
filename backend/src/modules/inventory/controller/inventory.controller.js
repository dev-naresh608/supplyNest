import { InventoryService } from '../service/inventory.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

export class InventoryController {
  constructor() {
    this.inventoryService = new InventoryService();
  }

  assignStock = async (req, res, next) => {
    try {
      const { childId, productId, quantity, notes } = req.body;
      const transaction = await this.inventoryService.assignStock(req.user, childId, productId, quantity, notes);
      return ApiResponse.success(res, 'Stock assigned successfully', transaction);
    } catch (error) {
      next(error);
    }
  };

  adjustStock = async (req, res, next) => {
    try {
      const { productId, quantity, type, notes } = req.body;
      const result = await this.inventoryService.adjustStock(req.user, productId, quantity, type, notes);
      return ApiResponse.success(res, 'Stock adjustment completed', result);
    } catch (error) {
      next(error);
    }
  };

  getMyInventory = async (req, res, next) => {
    try {
      const result = await this.inventoryService.getMyInventory(req.user, req.query);
      return ApiResponse.success(res, 'Current inventory balances fetched', result.items, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req, res, next) => {
    try {
      const result = await this.inventoryService.getTransactionHistory(req.user, req.query);
      return ApiResponse.success(res, 'Stock transaction history fetched', result.items, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getLowStockAlerts = async (req, res, next) => {
    try {
      const alerts = await this.inventoryService.getLowStockAlerts(req.user);
      return ApiResponse.success(res, 'Low stock alerts fetched', alerts);
    } catch (error) {
      next(error);
    }
  };
}
