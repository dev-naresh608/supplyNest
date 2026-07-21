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
    return await this.roleRepo.findByBusiness(currentUser._id, options);
  }

  async getRoleById(roleId, currentUser) {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw ApiError.notFound('Role not found');

    if (role.parentBusiness.toString() !== currentUser._id.toString() && currentUser.userType !== 'SUPER_ADMIN') {
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

  async assignRoleToStaff(staffUserId, roleId, currentUser) {
    const staff = await User.findById(staffUserId);
    if (!staff || staff.isDeleted) throw ApiError.notFound('Staff user not found');

    // Ensure staff belongs to current business downline
    if (staff.parentUser.toString() !== currentUser._id.toString() && currentUser.userType !== 'SUPER_ADMIN') {
      throw ApiError.forbidden('You can only assign roles to staff in your branch');
    }

    const role = await this.getRoleById(roleId, currentUser);
    staff.role = role._id;
    await staff.save();

    return staff;
  }

  async getRoleStats(currentUser) {
    return await this.roleRepo.getRoleStats(currentUser._id);
  }
}
