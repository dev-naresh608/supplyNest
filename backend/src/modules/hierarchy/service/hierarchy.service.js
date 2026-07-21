import { HierarchyRepository } from '../repository/hierarchy.repository.js';
import { User } from '../../auth/model/User.js';
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

    // Prevent transferring root or moving to own descendant
    if (!child.parentUser) throw ApiError.badRequest('Root user cannot be transferred');
    if (newParent.ancestorPath.includes(child._id.toString())) {
      throw ApiError.badRequest('Cannot transfer a user to one of their own descendants');
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

  async deleteChildUser(childId, requestingUser) {
    const child = await User.findById(childId);
    if (!child) throw ApiError.notFound('User not found');

    const childrenCount = await this.hierarchyRepo.countChildren(childId);
    if (childrenCount > 0) {
      throw ApiError.badRequest(`Cannot delete user with ${childrenCount} active children. Please transfer children first.`);
    }

    child.isDeleted = true;
    child.status = ACCOUNT_STATUS.DELETED;
    await child.save();

    return true;
  }
}
