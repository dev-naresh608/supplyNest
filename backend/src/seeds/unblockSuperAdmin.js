import mongoose from 'mongoose';
import { User } from '../modules/auth/model/User.js';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from '../constants/userRoles.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/Logger.js';

const unblockAdmin = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    const updated = await User.updateMany(
      { userType: SYSTEM_USER_TYPES.SUPER_ADMIN },
      {
        status: ACCOUNT_STATUS.ACTIVE,
        isDeleted: false,
        failedLoginAttempts: 0,
        lockUntil: null,
      }
    );
    logger.info(`Super Admin accounts unblocked & restored to ACTIVE: ${JSON.stringify(updated)}`);
    await mongoose.disconnect();
  } catch (err) {
    logger.error(`Error unblocking Super Admin: ${err.message}`);
    process.exit(1);
  }
};

unblockAdmin();
