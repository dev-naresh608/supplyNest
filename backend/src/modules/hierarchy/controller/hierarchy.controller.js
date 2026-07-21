import { HierarchyService } from '../service/hierarchy.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

export class HierarchyController {
  constructor() {
    this.hierarchyService = new HierarchyService();
  }

  createChildUser = async (req, res, next) => {
    try {
      const child = await this.hierarchyService.createChildUser(req.user, req.body);
      return ApiResponse.created(res, 'Child user created successfully', child);
    } catch (error) {
      next(error);
    }
  };

  getTree = async (req, res, next) => {
    try {
      const tree = await this.hierarchyService.getTree(req.user);
      return ApiResponse.success(res, 'Hierarchy tree fetched', tree);
    } catch (error) {
      next(error);
    }
  };

  getDirectChildren = async (req, res, next) => {
    try {
      const children = await this.hierarchyService.getDirectChildren(req.user._id);
      return ApiResponse.success(res, 'Direct children retrieved', children);
    } catch (error) {
      next(error);
    }
  };

  getDownline = async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const downline = await this.hierarchyService.getDownline(req.user, { status, search });
      return ApiResponse.success(res, 'Downline retrieved successfully', downline);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req, res, next) => {
    try {
      const stats = await this.hierarchyService.getHierarchyStats(req.user);
      return ApiResponse.success(res, 'Hierarchy statistics retrieved', stats);
    } catch (error) {
      next(error);
    }
  };

  transferChild = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { newParentId } = req.body;
      const updated = await this.hierarchyService.transferChild(id, newParentId, req.user);
      return ApiResponse.success(res, 'Child transferred successfully', updated);
    } catch (error) {
      next(error);
    }
  };

  deleteChild = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.hierarchyService.deleteChildUser(id, req.user);
      return ApiResponse.success(res, 'Child user soft deleted');
    } catch (error) {
      next(error);
    }
  };
}
