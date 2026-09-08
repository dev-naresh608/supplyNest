import mongoose from 'mongoose';
import { User } from '../modules/auth/model/User.js';
import { Category, Brand } from '../modules/product/model/Category.js';
import { Role } from '../modules/role/model/Role.js';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from '../constants/userRoles.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/Logger.js';

export const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.info('Connected to MongoDB for Seeding...');

    const existingAdmin = await User.findOne({ userType: SYSTEM_USER_TYPES.SUPER_ADMIN });
    let admin;

    if (!existingAdmin) {
      admin = await User.create({
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
      logger.info('Super Admin created: admin@invora.com / invora123');
    } else {
      admin = existingAdmin;
      logger.info('Super Admin already exists.');
    }

    // Seed default categories
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      const parentCat = await Category.create({ name: 'Electronics & Hardware', slug: 'electronics-hardware' });
      await Category.create({ name: 'Mobile Accessories', slug: 'mobile-accessories', parentCategory: parentCat._id });
      await Category.create({ name: 'Industrial Supplies', slug: 'industrial-supplies' });
      logger.info('Default categories seeded.');
    }

    // Seed default brands
    const brandCount = await Brand.countDocuments();
    if (brandCount === 0) {
      await Brand.create({ name: 'Invora Prime' });
      await Brand.create({ name: 'Nexus Distribution' });
      logger.info('Default brands seeded.');
    }

    // Seed default roles
    const roleCount = await Role.countDocuments();
    if (roleCount === 0) {
      const fullPermissions = {
        view: true,
        create: true,
        update: true,
        delete: true,
        approve: true,
        reject: true,
        export: true,
        import: true,
        assign: true,
        transfer: true,
      };

      await Role.create({
        roleName: 'Regional Distributor',
        description: 'Full regional branch distribution and inventory access',
        parentBusiness: admin._id,
        createdBy: admin._id,
        status: 'ACTIVE',
        permissions: {
          products: { view: true, create: false, update: false, delete: false, export: true },
          inventory: fullPermissions,
          orders: fullPermissions,
          users: { view: true, create: true, update: true, delete: false, assign: true, transfer: true },
          reports: { view: true, export: true },
          revenue: { view: true, export: true },
          roles: { view: true, create: true, update: true, delete: false },
          audit: { view: true },
        },
      });

      await Role.create({
        roleName: 'Warehouse Manager',
        description: 'Stock inward, allocations, dispatch, and damaged reporting',
        parentBusiness: admin._id,
        createdBy: admin._id,
        status: 'ACTIVE',
        permissions: {
          products: { view: true, export: true },
          inventory: { view: true, create: true, update: true, delete: false, approve: false, export: true, assign: true, transfer: true },
          orders: { view: true, update: true },
          users: { view: true },
          reports: { view: true, export: true },
          revenue: { view: false },
          roles: { view: false },
          audit: { view: true },
        },
      });
      logger.info('Default roles seeded.');
    }

    logger.info('Seeding completed successfully.');
    await mongoose.disconnect();
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
