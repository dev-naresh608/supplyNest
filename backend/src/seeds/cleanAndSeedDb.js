import mongoose from 'mongoose';
import { User } from '../modules/auth/model/User.js';
import { Session } from '../modules/auth/model/Session.js';
import { LoginHistory } from '../modules/auth/model/LoginHistory.js';
import { Product } from '../modules/product/model/Product.js';
import { Category, Brand } from '../modules/product/model/Category.js';
import { Inventory } from '../modules/inventory/model/Inventory.js';
import { StockTransaction } from '../modules/inventory/model/StockTransaction.js';
import { StockAdjustmentRequest } from '../modules/inventory/model/StockAdjustmentRequest.js';
import { Role } from '../modules/role/model/Role.js';
import { RevenueTransaction } from '../modules/revenue/model/RevenueTransaction.js';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from '../constants/userRoles.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/Logger.js';

export const cleanAndSeedDb = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.info('Connected to MongoDB for complete database reset...');

    // 1. Clean all collections
    logger.info('Wiping all existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Session.deleteMany({}),
      LoginHistory.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Inventory.deleteMany({}),
      StockTransaction.deleteMany({}),
      StockAdjustmentRequest.deleteMany({}),
      Role.deleteMany({}),
      RevenueTransaction.deleteMany({}),
    ]);
    logger.info('All collections successfully cleaned and emptied.');

    // 2. Create clean Super Admin user
    const superAdmin = await User.create({
      firstName: 'System',
      lastName: 'SuperAdmin',
      email: 'admin@invora.com',
      password: 'invora123',
      userType: SYSTEM_USER_TYPES.SUPER_ADMIN,
      status: ACCOUNT_STATUS.ACTIVE,
      hierarchyLevel: 0,
      ancestorPath: '',
      isEmailVerified: true,
    });
    logger.info(`Super Admin initialized: admin@invora.com / invora123 (ID: ${superAdmin._id})`);

    // 3. Seed baseline clean categories
    const electronics = await Category.create({
      name: 'Electronics & Hardware',
      slug: 'electronics-hardware',
      description: 'General consumer & enterprise hardware',
    });

    await Category.create({
      name: 'Smart Accessories',
      slug: 'smart-accessories',
      parentCategory: electronics._id,
      description: 'Cables, chargers, peripherals',
    });

    await Category.create({
      name: 'Industrial Supplies',
      slug: 'industrial-supplies',
      description: 'Raw materials & assembly tools',
    });

    // 4. Seed baseline clean brands
    await Brand.create({ name: 'Invora Prime', description: 'Flagship enterprise brand' });
    await Brand.create({ name: 'Nexus Distribution', description: 'Logistics and industrial brand' });

    logger.info('Clean database initialization completed successfully!');
    await mongoose.disconnect();
  } catch (error) {
    logger.error(`Database reset failed: ${error.message}`);
    process.exit(1);
  }
};

cleanAndSeedDb();
