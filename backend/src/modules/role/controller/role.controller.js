import { RoleService } from '../service/role.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

export class RoleController {
  constructor() {
    this.roleService = new RoleService();
  }

  createRole = async (req, res, next) => {
    try {
      const role = await this.roleService.createRole(req.user, req.body);
      return ApiResponse.created(res, 'Dynamic role created', role);
    } catch (error) {
      next(error);
    }
  };

  getRoles = async (req, res, next) => {
    try {
      const roles = await this.roleService.getBusinessRoles(req.user, req.query);
      return ApiResponse.success(res, 'Roles retrieved', roles);
    } catch (error) {
      next(error);
    }
  };

  getRoleById = async (req, res, next) => {
    try {
      const role = await this.roleService.getRoleById(req.params.id, req.user);
      return ApiResponse.success(res, 'Role details fetched', role);
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (req, res, next) => {
    try {
      const updated = await this.roleService.updateRole(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Role updated successfully', updated);
    } catch (error) {
      next(error);
    }
  };

  cloneRole = async (req, res, next) => {
    try {
      const cloned = await this.roleService.cloneRole(req.params.id, req.body.newRoleName, req.user);
      return ApiResponse.created(res, 'Role cloned successfully', cloned);
    } catch (error) {
      next(error);
    }
  };

  assignRole = async (req, res, next) => {
    try {
      const { staffUserId, userId, roleId } = req.body;
      const targetUserId = userId || staffUserId;
      if (!targetUserId) {
        return ApiResponse.badRequest(res, 'Target user ID is required');
      }
      const updatedUser = await this.roleService.assignRoleToUser(targetUserId, roleId, req.user);
      return ApiResponse.success(res, 'Role assignment updated successfully', updatedUser);
    } catch (error) {
      next(error);
    }
  };

  deleteRole = async (req, res, next) => {
    try {
      const result = await this.roleService.deleteRole(req.params.id, req.user);
      return ApiResponse.success(res, 'Role deleted successfully', result);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req, res, next) => {
    try {
      const stats = await this.roleService.getRoleStats(req.user);
      return ApiResponse.success(res, 'Role statistics fetched', stats);
    } catch (error) {
      next(error);
    }
  };
}

