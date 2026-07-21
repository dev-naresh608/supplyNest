import { ApiError } from '../../../utils/ApiError.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

export const checkPermission = (moduleName, action) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(ApiError.unauthorized('User not authenticated'));

    // Super Admin & Business Owners have full authority over their branch
    if (user.userType === SYSTEM_USER_TYPES.SUPER_ADMIN || user.userType === SYSTEM_USER_TYPES.BUSINESS) {
      return next();
    }

    // Staff Users check dynamic role permissions
    if (user.userType === SYSTEM_USER_TYPES.STAFF) {
      if (!user.role || !user.role.permissions) {
        return next(ApiError.forbidden('No dynamic role or permissions assigned'));
      }

      const modulePerms = user.role.permissions[moduleName];
      if (modulePerms && modulePerms[action] === true) {
        return next();
      }

      return next(ApiError.forbidden(`You lack '${action}' permission on '${moduleName}' module`));
    }

    return next(ApiError.forbidden('Access denied'));
  };
};
