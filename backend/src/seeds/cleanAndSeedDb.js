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
    const invoraPrime = await Brand.create({ name: 'Invora Prime', description: 'Flagship enterprise brand' });
    const nexusDist = await Brand.create({ name: 'Nexus Distribution', description: 'Logistics and industrial brand' });

    // 5. Seed default starter roles for immediate assignment
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

    const regionalDistRole = await Role.create({
      roleName: 'Regional Distributor',
      description: 'Full regional branch distribution and inventory access',
      parentBusiness: superAdmin._id,
      createdBy: superAdmin._id,
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

    const warehouseRole = await Role.create({
      roleName: 'Warehouse Manager',
      description: 'Stock inward, allocations, dispatch, and damaged reporting',
      parentBusiness: superAdmin._id,
      createdBy: superAdmin._id,
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

    const retailPartnerRole = await Role.create({
      roleName: 'Retail Partner',
      description: 'Retail branch inventory tracking and sales',
      parentBusiness: superAdmin._id,
      createdBy: superAdmin._id,
      status: 'ACTIVE',
      permissions: {
        products: { view: true },
        inventory: { view: true, update: true, export: true },
        orders: { view: true, create: true },
        users: { view: false },
        reports: { view: true },
        revenue: { view: true },
        roles: { view: false },
        audit: { view: false },
      },
    });

    // 6. Seed starter master products with initial stock
    const prod1 = await Product.create({
      productName: 'Invora Edge Router X100',
      sku: 'INV-RTR-X100',
      barcode: '8901234567890',
      category: electronics._id,
      brand: invoraPrime._id,
      description: 'High-throughput enterprise distribution edge router',
      costPrice: 2400,
      purchasePrice: 2800,
      sellingPrice: 3800,
      mrp: 4500,
      status: 'ACTIVE',
      createdBy: superAdmin._id,
    });

    const prod2 = await Product.create({
      productName: 'Nexus Pro Heavy-Duty Barcode Scanner',
      sku: 'NEX-SCN-200',
      barcode: '8901234567891',
      category: electronics._id,
      brand: nexusDist._id,
      description: 'Rugged wireless 2D barcode scanner for distribution hubs',
      costPrice: 1500,
      purchasePrice: 1800,
      sellingPrice: 2600,
      mrp: 3200,
      status: 'ACTIVE',
      createdBy: superAdmin._id,
    });

    // Seed root inventory for products
    await Inventory.create({
      ownerId: superAdmin._id,
      productId: prod1._id,
      availableQty: 150,
      reservedQty: 0,
      damagedQty: 0,
      lowStockThreshold: 10,
    });

    await Inventory.create({
      ownerId: superAdmin._id,
      productId: prod2._id,
      availableQty: 200,
      reservedQty: 0,
      damagedQty: 0,
      lowStockThreshold: 10,
    });

    await StockTransaction.create([
      {
        productId: prod1._id,
        fromOwnerId: null,
        toOwnerId: superAdmin._id,
        quantity: 150,
        transactionType: 'OPENING_STOCK',
        notes: 'Initial master stock allocation for Invora Edge Router X100',
        performedBy: superAdmin._id,
      },
      {
        productId: prod2._id,
        fromOwnerId: null,
        toOwnerId: superAdmin._id,
        quantity: 200,
        transactionType: 'OPENING_STOCK',
        notes: 'Initial master stock allocation for Nexus Scanner',
        performedBy: superAdmin._id,
      },
    ]);

    logger.info('Clean database initialization completed successfully with default roles, categories, brands, products, and inventory stock!');
    await mongoose.disconnect();
  } catch (error) {
    logger.error(`Database reset failed: ${error.message}`);
    process.exit(1);
  }
};

cleanAndSeedDb();
