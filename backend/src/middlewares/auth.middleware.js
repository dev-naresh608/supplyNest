import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/TokenUtils.js';
import { User } from '../modules/auth/model/User.js';
import { ACCOUNT_STATUS } from '../constants/userRoles.js';

export const protect = async (req, res, next) => {
  try {
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication required');
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).populate('role').exec();

    if (!user || user.isDeleted) {
      throw ApiError.unauthorized('The user belonging to this token no longer exists');
    }

    if (user.status !== ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.forbidden(`Account status is ${user.status}. Access denied.`);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
};
