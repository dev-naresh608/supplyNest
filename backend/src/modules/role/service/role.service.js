import { RoleRepository } from '../repository/role.repository.js';
import { ApiError } from '../../../utils/ApiError.js';
import { User } from '../../auth/model/User.js';

export class RoleService {
  constructor() {
    this.roleRepo = new RoleRepository();
  }

  async createRole(currentUser, roleData) {
    const businessId = currentUser._id;
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

  async getBusinessRoles(currentUser, options) {
    const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;
    return await this.roleRepo.findByBusiness(businessId, options);
  }

  async getRoleById(roleId, currentUser) {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw ApiError.notFound('Role not found');

    const businessId = currentUser.userType === 'STAFF' ? currentUser.parentUser : currentUser._id;
    if (role.parentBusiness.toString() !== businessId.toString() && currentUser.userType !== 'SUPER_ADMIN') {
      throw ApiError.forbidden('Access denied to role from another branch');
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

    const duplicate = await this.roleRepo.findByNameAndBusiness(newRoleName, currentUser._id);
    if (duplicate) {
      throw ApiError.conflict(`Role with name "${newRoleName}" already exists`);
    }

    const cloned = await this.roleRepo.createRole({
      roleName: newRoleName,
      description: `Cloned from ${existingRole.roleName}`,
      parentBusiness: currentUser._id,
      createdBy: currentUser._id,
      permissions: existingRole.permissions,
      status: 'ACTIVE',
    });

    return cloned;
  }

  async assignRoleToUser(targetUserId, roleId, currentUser) {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.isDeleted) throw ApiError.notFound('Target user not found');

    // Super Admin or direct/downline parent check
    if (currentUser.userType !== 'SUPER_ADMIN') {
      const isDirectChild = targetUser.parentUser?.toString() === currentUser._id.toString();
      const isDownline = targetUser.ancestorPath && targetUser.ancestorPath.includes(currentUser._id.toString());
      const isSelf = targetUser._id.toString() === currentUser._id.toString();

      if (!isDirectChild && !isDownline && !isSelf) {
        throw ApiError.forbidden('You can only assign roles to users within your downline hierarchy');
      }
    }

    if (roleId) {
      const role = await this.getRoleById(roleId, currentUser);
      targetUser.role = role._id;
    } else {
      targetUser.role = null;
    }

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


