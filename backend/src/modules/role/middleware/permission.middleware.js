import { ApiError } from '../../../utils/ApiError.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

export const checkPermission = (moduleName, action) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(ApiError.unauthorized('User not authenticated'));

    // Super Admin has master authority across the entire platform
    if (user.userType === SYSTEM_USER_TYPES.SUPER_ADMIN) {
      return next();
    }

    // Map module aliases (e.g. 'hierarchy' corresponds to 'users' permission matrix)
    const targetModule = moduleName === 'hierarchy' ? 'users' : moduleName;

    // Check dynamic role permissions assigned to this user
    if (user.role && user.role.permissions) {
      const modulePerms = user.role.permissions[targetModule] || user.role.permissions[moduleName];
      
      const hasPerm =
        modulePerms &&
        (modulePerms[action] === true ||
          (action === 'update' && modulePerms.edit === true) ||
          (action === 'edit' && modulePerms.update === true));

      if (hasPerm) {
        return next();
      }

      return next(
        ApiError.forbidden(
          `Access Denied: You lack '${action}' permission on '${moduleName}' module (Role: ${user.role.roleName || 'Restricted'})`
        )
      );
    }

    // If user has no dynamic role assigned
    return next(ApiError.forbidden('Access Denied: No dynamic role or permissions assigned to your account'));
  };
};

