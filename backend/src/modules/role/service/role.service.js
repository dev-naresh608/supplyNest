import { RoleRepository } from '../repository/role.repository.js';
import { ApiError } from '../../../utils/ApiError.js';
import { User } from '../../auth/model/User.js';

export class RoleService {
  constructor() {
    this.roleRepo = new RoleRepository();
  }

  async createRole(currentUser, roleData) {
    const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;
    const existing = await this.roleRepo.findByNameAndBusiness(roleData.roleName, businessId);

    if (existing) {
      throw ApiError.conflict(`Role with name "${roleData.roleName}" already exists in your business`);
    }

    const role = await this.roleRepo.createRole({
      ...roleData,
      parentBusiness: businessId,
      createdBy: currentUser._id,
    });

    return role;
  }

  async getBusinessRoles(currentUser, options = {}) {
    const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;
    
    // Super Admin can optionally fetch all platform roles if query param all=true, otherwise scoped to their business
    if (currentUser.userType === 'SUPER_ADMIN' && options.all === 'true') {
      return await this.roleRepo.findAllRoles(options);
    }

    // Strict branch isolation: every business entity only sees their own roles
    return await this.roleRepo.findByBusiness(businessId, options);
  }

  async getRoleById(roleId, currentUser) {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw ApiError.notFound('Role not found');

    if (currentUser.userType !== 'SUPER_ADMIN') {
      const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;
      if (role.parentBusiness.toString() !== businessId.toString()) {
        throw ApiError.forbidden('Access denied: You can only view or manage roles belonging to your own business');
      }
    }
    return role;
  }

  async updateRole(roleId, updateData, currentUser) {
    const role = await this.getRoleById(roleId, currentUser);
    const updated = await this.roleRepo.updateRole(role._id, updateData);
    return updated;
  }

  async cloneRole(roleId, newRoleName, currentUser) {
    const existingRole = await this.getRoleById(roleId, currentUser);
    const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;

    const duplicate = await this.roleRepo.findByNameAndBusiness(newRoleName, businessId);
    if (duplicate) {
      throw ApiError.conflict(`Role with name "${newRoleName}" already exists in your business`);
    }

    const cloned = await this.roleRepo.createRole({
      roleName: newRoleName,
      description: `Cloned from ${existingRole.roleName}`,
      parentBusiness: businessId,
      createdBy: currentUser._id,
      permissions: existingRole.permissions,
      status: 'ACTIVE',
    });

    return cloned;
  }

  async assignRoleToUser(targetUserId, roleId, currentUser) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.isDeleted) throw ApiError.notFound('Target user not found');

    if (!roleId) {
      throw ApiError.badRequest('A dynamic role is mandatory and cannot be empty');
    }

    // Super Admin or direct/downline parent check
    if (currentUser.userType !== 'SUPER_ADMIN') {
      const isDirectChild = targetUser.parentUser?.toString() === currentUser._id.toString();
      const isDownline = targetUser.ancestorPath && targetUser.ancestorPath.includes(currentUser._id.toString());
      const isSelf = targetUser._id.toString() === currentUser._id.toString();

      if (!isDirectChild && !isDownline && !isSelf) {
        throw ApiError.forbidden('You can only assign roles to users within your downline hierarchy');
      }
    }

    const role = await this.getRoleById(roleId, currentUser);
    targetUser.role = role._id;

    await targetUser.save();
    return await User.findById(targetUser._id).populate('role', 'roleName permissions');
  }

  async deleteRole(roleId, currentUser) {
    const role = await this.getRoleById(roleId, currentUser);

    // Relational check: Check if any active user/staff is currently assigned to this role
    const assignedCount = await User.countDocuments({ role: role._id, isDeleted: false });
    if (assignedCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete role "${role.roleName}" because it is currently assigned to ${assignedCount} active staff member(s). Please reassign their roles first.`
      );
    }

    await this.roleRepo.deleteRole(role._id);
    return { deleted: true, roleName: role.roleName };
  }

  async getRoleStats(currentUser) {
    const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;
    return await this.roleRepo.getRoleStats(businessId);
  }
}


