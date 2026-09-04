import { HierarchyRepository } from '../repository/hierarchy.repository.js';
import { User } from '../../auth/model/User.js';
import { Session } from '../../auth/model/Session.js';
import { Inventory } from '../../inventory/model/Inventory.js';
import { ApiError } from '../../../utils/ApiError.js';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from '../../../constants/userRoles.js';

export class HierarchyService {
  constructor() {
    this.hierarchyRepo = new HierarchyRepository();
  }

  async createChildUser(creatorUser, userData) {
    if (creatorUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN && creatorUser.userType !== SYSTEM_USER_TYPES.BUSINESS) {
      throw ApiError.forbidden('Only Super Admin and Business Users can create downline users');
    }

    const existing = await User.findOne({ email: userData.email, isDeleted: false });
    if (existing) {
      throw ApiError.conflict('User with this email already exists');
    }

    const parentPath = creatorUser.ancestorPath
      ? `${creatorUser.ancestorPath}/${creatorUser._id}`
      : `${creatorUser._id}`;

    const newUser = new User({
      ...userData,
      userType: userData.userType || SYSTEM_USER_TYPES.BUSINESS,
      parentUser: creatorUser._id,
      ancestorPath: parentPath,
      hierarchyLevel: creatorUser.hierarchyLevel + 1,
      createdBy: creatorUser._id,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    return await newUser.save();
  }

  async getTree(currentUser) {
    const isSuperAdmin = currentUser.userType === SYSTEM_USER_TYPES.SUPER_ADMIN;

    let rootNodes;
    if (isSuperAdmin) {
      rootNodes = await User.find({ parentUser: null, isDeleted: false }).select('-password');
    } else {
      rootNodes = [currentUser];
    }

    const buildSubtree = async (node) => {
      const children = await this.hierarchyRepo.findDirectChildren(node._id);
      const childNodes = [];
      for (const child of children) {
        childNodes.push(await buildSubtree(child));
      }
      return {
        id: node._id,
        name: `${node.firstName} ${node.lastName}`,
        email: node.email,
        userType: node.userType,
        status: node.status,
        level: node.hierarchyLevel,
        childrenCount: children.length,
        children: childNodes,
      };
    };

    const tree = [];
    for (const root of rootNodes) {
      tree.push(await buildSubtree(root));
    }

    return tree;
  }

  async getDirectChildren(userId) {
    return await this.hierarchyRepo.findDirectChildren(userId);
  }

  async getDownline(currentUser, options) {
    return await this.hierarchyRepo.findDownline(currentUser, options);
  }

  async getHierarchyStats(currentUser) {
    return await this.hierarchyRepo.getBranchStats(currentUser);
  }

  async transferChild(childId, newParentId, requestingUser) {
    const child = await User.findById(childId);
    if (!child || child.isDeleted) throw ApiError.notFound('Target user not found');

    const newParent = await User.findById(newParentId);
    if (!newParent || newParent.isDeleted) throw ApiError.notFound('New parent user not found');

    // Hierarchy boundary security check for non-SuperAdmin
    if (requestingUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      const isChildInDownline =
        child.parentUser?.toString() === requestingUser._id.toString() ||
        (child.ancestorPath && child.ancestorPath.includes(requestingUser._id.toString()));

      const isNewParentInDownline =
        newParent._id.toString() === requestingUser._id.toString() ||
        (newParent.ancestorPath && newParent.ancestorPath.includes(requestingUser._id.toString()));

      if (!isChildInDownline || !isNewParentInDownline) {
        throw ApiError.forbidden('You can only transfer business nodes within your own downline hierarchy');
      }
    }

    // Prevent transferring root or moving to own descendant
    if (!child.parentUser) throw ApiError.badRequest('Root user cannot be transferred');
    if (newParent.ancestorPath && newParent.ancestorPath.includes(child._id.toString())) {
      throw ApiError.badRequest('Cannot transfer a user to one of their own descendants');
    }
    if (newParent._id.toString() === child._id.toString()) {
      throw ApiError.badRequest('Cannot transfer a user to itself');
    }

    const oldPrefix = `${child.ancestorPath}/${child._id}`;
    const newAncestorPath = newParent.ancestorPath
      ? `${newParent.ancestorPath}/${newParent._id}`
      : `${newParent._id}`;
    const newPrefix = `${newAncestorPath}/${child._id}`;

    const levelDiff = newParent.hierarchyLevel + 1 - child.hierarchyLevel;

    // Update child
    child.parentUser = newParent._id;
    child.ancestorPath = newAncestorPath;
    child.hierarchyLevel = newParent.hierarchyLevel + 1;
    await child.save();

    // Update all downline descendants
    await this.hierarchyRepo.updateDescendantPaths(oldPrefix, newPrefix, levelDiff);

    return child;
  }

  async updateChildUser(childId, updateData, requestingUser) {
    const child = await User.findById(childId);
    if (!child || child.isDeleted) throw ApiError.notFound('User not found');

    if (requestingUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      const isChildInDownline =
        child.parentUser?.toString() === requestingUser._id.toString() ||
        (child.ancestorPath && child.ancestorPath.includes(requestingUser._id.toString()));

      if (!isChildInDownline) {
        throw ApiError.forbidden('You can only update nodes within your downline hierarchy');
      }
    }

    // Handle email update uniqueness if email is changed
    if (updateData.email && updateData.email !== child.email) {
      const existingEmail = await User.findOne({
        email: updateData.email.toLowerCase().trim(),
        _id: { $ne: childId },
        isDeleted: false,
      });
      if (existingEmail) {
        throw ApiError.conflict('Another user already exists with this email address');
      }
      child.email = updateData.email.toLowerCase().trim();
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'status'];
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        child[field] = updateData[field];
      }
    });

    await child.save();
    return child;
  }

  async deleteChildUser(childId, requestingUser) {
    const child = await User.findById(childId);
    if (!child || child.isDeleted) throw ApiError.notFound('User not found');

    // Hierarchy boundary security check for non-SuperAdmin
    if (requestingUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      const isChildInDownline =
        child.parentUser?.toString() === requestingUser._id.toString() ||
        (child.ancestorPath && child.ancestorPath.includes(requestingUser._id.toString()));

      if (!isChildInDownline) {
        throw ApiError.forbidden('You can only delete business nodes within your own downline hierarchy');
      }
    }

    if (!child.parentUser) {
      throw ApiError.badRequest('The root system organization node cannot be deleted');
    }

    if (childId.toString() === requestingUser._id.toString()) {
      throw ApiError.badRequest('You cannot delete your own account from the hierarchy view');
    }

    // 1. Relational Check: Active child nodes
    const childrenCount = await User.countDocuments({ parentUser: childId, isDeleted: false });
    if (childrenCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete node "${child.firstName} ${child.lastName}" because they have ${childrenCount} active downline child node(s). Please transfer or remove child nodes first.`
      );
    }

    // 2. Relational Check: Active staff members assigned
    const staffCount = await User.countDocuments({ parentUser: childId, userType: SYSTEM_USER_TYPES.STAFF, isDeleted: false });
    if (staffCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete business node "${child.firstName} ${child.lastName}" because ${staffCount} staff member(s) are assigned to it. Please reassign or delete staff accounts first.`
      );
    }

    // 3. Relational Check: Active inventory stock balances held by this node
    const activeInventory = await Inventory.find({
      ownerId: childId,
      $or: [{ availableQty: { $gt: 0 } }, { reservedQty: { $gt: 0 } }],
    });

    if (activeInventory.length > 0) {
      const totalStock = activeInventory.reduce((sum, inv) => sum + (inv.availableQty || 0), 0);
      throw ApiError.badRequest(
        `Cannot delete node "${child.firstName} ${child.lastName}" because they currently hold ${totalStock} units of active stock across ${activeInventory.length} product(s). Please transfer or adjust stock to 0 first.`
      );
    }

    // 4. Revoke all active sessions for this user so they are instantly invalidated
    await Session.updateMany({ userId: childId }, { isRevoked: true });

    // 5. Soft-delete user
    child.isDeleted = true;
    child.status = ACCOUNT_STATUS.DELETED;
    await child.save();

    return {
      deleted: true,
      name: `${child.firstName} ${child.lastName}`,
      email: child.email,
    };
  }
}


