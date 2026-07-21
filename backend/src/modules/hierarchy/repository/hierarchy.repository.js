import { User } from '../../auth/model/User.js';

export class HierarchyRepository {
  async findDirectChildren(parentId, options = {}) {
    const query = { parentUser: parentId, isDeleted: false };
    if (options.status) query.status = options.status;

    return await User.find(query)
      .populate('role', 'roleName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findDownline(user, options = {}) {
    // A user's downline comprises any user whose ancestorPath contains or starts with this user's ID
    const searchPathPattern = new RegExp(`(^|/)${user._id}(/|$)`);
    const query = {
      _id: { $ne: user._id },
      ancestorPath: { $regex: searchPathPattern },
      isDeleted: false,
    };

    if (options.status) query.status = options.status;
    if (options.search) {
      query.$or = [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    return await User.find(query)
      .populate('role', 'roleName')
      .sort(options.sort || { createdAt: -1 })
      .exec();
  }

  async countChildren(parentId) {
    return await User.countDocuments({ parentUser: parentId, isDeleted: false });
  }

  async getBranchStats(user) {
    const searchPathPattern = new RegExp(`(^|/)${user._id}(/|$)`);
    const downlineUsers = await User.find({
      ancestorPath: { $regex: searchPathPattern },
      isDeleted: false,
    }).select('status hierarchyLevel');

    const totalDescendants = downlineUsers.length;
    const activeCount = downlineUsers.filter((u) => u.status === 'ACTIVE').length;
    const inactiveCount = downlineUsers.filter((u) => u.status !== 'ACTIVE').length;
    const maxLevel = downlineUsers.reduce((max, u) => Math.max(max, u.hierarchyLevel), user.hierarchyLevel);

    return {
      directChildren: await this.countChildren(user._id),
      totalDescendants,
      activeDescendants: activeCount,
      inactiveDescendants: inactiveCount,
      maxDepth: maxLevel - user.hierarchyLevel,
      currentLevel: user.hierarchyLevel,
    };
  }

  async updateDescendantPaths(oldPrefix, newPrefix, levelDiff) {
    const searchRegex = new RegExp(`^${oldPrefix}`);
    const descendants = await User.find({ ancestorPath: { $regex: searchRegex } });

    for (const desc of descendants) {
      desc.ancestorPath = desc.ancestorPath.replace(searchRegex, newPrefix);
      desc.hierarchyLevel += levelDiff;
      await desc.save();
    }
  }
}
