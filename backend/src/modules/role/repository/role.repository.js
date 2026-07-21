import { Role } from '../model/Role.js';
import { User } from '../../auth/model/User.js';

export class RoleRepository {
  async createRole(roleData) {
    const role = new Role(roleData);
    return await role.save();
  }

  async findById(roleId) {
    return await Role.findById(roleId).where({ isDeleted: false }).exec();
  }

  async findByBusiness(businessId, options = {}) {
    const query = { parentBusiness: businessId, isDeleted: false };
    if (options.status) query.status = options.status;

    return await Role.find(query).sort({ roleName: 1 }).exec();
  }

  async findByNameAndBusiness(roleName, businessId) {
    return await Role.findOne({ roleName, parentBusiness: businessId, isDeleted: false });
  }

  async updateRole(roleId, updateData) {
    return await Role.findByIdAndUpdate(roleId, updateData, { new: true, runValidators: true });
  }

  async getRoleStats(businessId) {
    const roles = await Role.find({ parentBusiness: businessId, isDeleted: false });

    const totalRoles = roles.length;
    const activeRoles = roles.filter((r) => r.status === 'ACTIVE').length;
    const inactiveRoles = roles.filter((r) => r.status === 'INACTIVE').length;
    const archivedRoles = roles.filter((r) => r.status === 'ARCHIVED').length;

    // Count staff assigned per role
    const roleIds = roles.map((r) => r._id);
    const assignedCounts = await User.aggregate([
      { $match: { role: { $in: roleIds }, isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    assignedCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const rolesWithCounts = roles.map((r) => ({
      ...r.toObject(),
      assignedUsersCount: countMap[r._id.toString()] || 0,
    }));

    return {
      totalRoles,
      activeRoles,
      inactiveRoles,
      archivedRoles,
      roles: rolesWithCounts,
    };
  }
}
