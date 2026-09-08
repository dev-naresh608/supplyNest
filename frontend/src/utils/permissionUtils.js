/**
 * Helper to check whether the current user has permission to perform an action on a module.
 * - SUPER_ADMIN always has full access.
 * - Other users evaluate the dynamic role's permission matrix.
 *
 * @param {Object} user - Redux currentUser object
 * @param {string} moduleName - Module name (e.g. 'users', 'hierarchy', 'roles', 'products', 'inventory', 'revenue')
 * @param {string} action - Action name ('view', 'create', 'update', 'edit', 'delete', 'approve', 'export', 'transfer', 'assign')
 * @returns {boolean}
 */
export const hasPermission = (user, moduleName, action) => {
  if (!user) return false;

  // Super Admin has master authority
  if (user.userType === 'SUPER_ADMIN') return true;

  if (!user.role || !user.role.permissions) {
    return false;
  }

  const targetModule = moduleName === 'hierarchy' ? 'users' : moduleName;
  const modulePerms = user.role.permissions[targetModule] || user.role.permissions[moduleName];

  if (!modulePerms) return false;

  if (action === 'update' || action === 'edit') {
    return Boolean(modulePerms.update || modulePerms.edit);
  }

  if (action === 'transfer') {
    return Boolean(modulePerms.transfer || modulePerms.update || modulePerms.edit);
  }

  if (action === 'assign') {
    return Boolean(modulePerms.assign || modulePerms.update || modulePerms.edit);
  }

  return Boolean(modulePerms[action]);
};
