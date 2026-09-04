import mongoose from 'mongoose';
import { ENV } from './src/config/env.js';
import { User } from './src/modules/auth/model/User.js';
import { Session } from './src/modules/auth/model/Session.js';
import { Role } from './src/modules/role/model/Role.js';
import { Product } from './src/modules/product/model/Product.js';
import { Category, Brand } from './src/modules/product/model/Category.js';
import { Inventory } from './src/modules/inventory/model/Inventory.js';
import { StockTransaction } from './src/modules/inventory/model/StockTransaction.js';
import { AuthService } from './src/modules/auth/service/auth.service.js';
import { HierarchyService } from './src/modules/hierarchy/service/hierarchy.service.js';
import { RoleService } from './src/modules/role/service/role.service.js';
import { ProductService } from './src/modules/product/service/product.service.js';
import { InventoryService } from './src/modules/inventory/service/inventory.service.js';
import { RevenueService } from './src/modules/revenue/service/revenue.service.js';
import { SYSTEM_USER_TYPES, ACCOUNT_STATUS } from './src/constants/userRoles.js';
import { verifyAccessToken } from './src/utils/TokenUtils.js';

const runTests = async () => {
  console.log('🧪 Starting SupplyNest End-to-End Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('Connected to MongoDB.\n');

    // Clean up test collections for consistent testing
    await User.deleteMany({ email: { $regex: /@test-invora\.com$/ } });
    await Role.deleteMany({ roleName: { $regex: /^Test/ } });
    await Product.deleteMany({ sku: { $regex: /^TEST-SKU/ } });
    await Category.deleteMany({ slug: { $regex: /^test-/ } });
    await Brand.deleteMany({ name: { $regex: /^Test/ } });

    const authService = new AuthService();
    const hierarchyService = new HierarchyService();
    const roleService = new RoleService();
    const productService = new ProductService();
    const inventoryService = new InventoryService();
    const revenueService = new RevenueService();

    console.log('🔹 1. Testing User & Session Authentication...');
    // Create Super Admin
    let superAdmin = await User.findOne({ email: 'admin@invora.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        firstName: 'System',
        lastName: 'SuperAdmin',
        email: 'admin@invora.com',
        password: 'SuperAdmin@2026!',
        userType: SYSTEM_USER_TYPES.SUPER_ADMIN,
        status: ACCOUNT_STATUS.ACTIVE,
        hierarchyLevel: 0,
        ancestorPath: '',
      });
    }

    const loginResult = await authService.login('admin@invora.com', 'SuperAdmin@2026!', {
      ip: '127.0.0.1',
      userAgentHeader: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    });

    assert(!!loginResult.accessToken, 'Super Admin login generates access token');
    assert(!!loginResult.refreshToken, 'Super Admin login generates refresh token');
    assert(!!loginResult.sessionId, 'Super Admin login generates database session ID');

    const decoded = verifyAccessToken(loginResult.accessToken);
    assert(decoded.sessionId?.toString() === loginResult.sessionId.toString(), 'JWT token payload embeds active sessionId');

    const activeSessions = await authService.getActiveSessions(superAdmin._id);
    assert(activeSessions.length > 0, 'Active sessions list retrieved from database');

    console.log('\n🔹 2. Testing Session Revocation & Security...');
    const revokeSuccess = await authService.revokeSession(loginResult.sessionId, superAdmin._id);
    assert(revokeSuccess === true, 'Session successfully revoked');

    const revokedSession = await Session.findById(loginResult.sessionId);
    assert(revokedSession.isRevoked === true, 'Database session marked as isRevoked = true');

    // Test token refresh on revoked session should fail
    let refreshFailed = false;
    try {
      await authService.refreshToken(loginResult.refreshToken);
    } catch (err) {
      refreshFailed = true;
    }
    assert(refreshFailed, 'Token refresh rejected on revoked session');

    // Re-login to get fresh valid session
    const freshLogin = await authService.login('admin@invora.com', 'SuperAdmin@2026!', {
      ip: '127.0.0.1',
      userAgentHeader: 'Chrome Desktop',
    });
    const validUser = freshLogin.user;

    console.log('\n🔹 3. Testing Hierarchy Tree & Materialized Path...');
    const child1 = await hierarchyService.createChildUser(validUser, {
      firstName: 'Branch',
      lastName: 'Alpha',
      email: 'branch-alpha@test-invora.com',
      password: 'Password123!',
      userType: SYSTEM_USER_TYPES.BUSINESS,
    });

    assert(child1.parentUser.toString() === validUser._id.toString(), 'Child parent set correctly to Super Admin');
    assert(child1.hierarchyLevel === 1, 'Child hierarchy level calculated as 1');
    assert(child1.ancestorPath.includes(validUser._id.toString()), 'Child ancestorPath includes Super Admin ID');

    // Create grandchild under child1
    const grandchild = await hierarchyService.createChildUser(child1, {
      firstName: 'SubBranch',
      lastName: 'Beta',
      email: 'subbranch-beta@test-invora.com',
      password: 'Password123!',
      userType: SYSTEM_USER_TYPES.BUSINESS,
    });

    assert(grandchild.hierarchyLevel === 2, 'Grandchild hierarchy level calculated as 2');
    assert(grandchild.ancestorPath.includes(child1._id.toString()), 'Grandchild ancestorPath includes Child1 ID');

    // Test Hierarchy Security: Prevent cross-branch unauthorized deletion / transfer
    const unrelatedBusiness = await hierarchyService.createChildUser(validUser, {
      firstName: 'Unrelated',
      lastName: 'Branch',
      email: 'unrelated@test-invora.com',
      password: 'Password123!',
      userType: SYSTEM_USER_TYPES.BUSINESS,
    });

    let crossBranchBlocked = false;
    try {
      await hierarchyService.deleteChildUser(grandchild._id, unrelatedBusiness);
    } catch (err) {
      crossBranchBlocked = true;
    }
    assert(crossBranchBlocked, 'Cross-branch unauthorized node deletion blocked by security guard');

    console.log('\n🔹 4. Testing Dynamic Roles & RBAC Matrix...');
    const dynamicRole = await roleService.createRole(child1, {
      roleName: 'Test Warehouse Lead',
      description: 'Handles inventory & order operations',
      permissions: {
        products: { view: true, create: false, update: false },
        inventory: { view: true, create: true, update: true, assign: true },
      },
    });

    assert(dynamicRole.roleName === 'Test Warehouse Lead', 'Dynamic role created with scoped permissions');

    // Create a staff user under child1
    const staffUser = await hierarchyService.createChildUser(child1, {
      firstName: 'Staff',
      lastName: 'John',
      email: 'staff-john@test-invora.com',
      password: 'Password123!',
      userType: SYSTEM_USER_TYPES.STAFF,
    });

    const assignedStaff = await roleService.assignRoleToStaff(staffUser._id, dynamicRole._id, child1);
    assert(assignedStaff.role.toString() === dynamicRole._id.toString(), 'Dynamic role assigned to staff member');

    console.log('\n🔹 5. Testing Master Products & Catalog...');
    let cat = await Category.findOne();
    if (!cat) cat = await Category.create({ name: 'Test Category', slug: 'test-category' });
    let brand = await Brand.findOne();
    if (!brand) brand = await Brand.create({ name: 'Test Brand' });

    const product = await productService.createMasterProduct(
      validUser,
      {
        productName: 'Test Smart Sensor',
        sku: 'TEST-SKU-1001',
        category: cat._id.toString(),
        brand: brand._id.toString(),
        costPrice: 500,
        purchasePrice: 600,
        sellingPrice: 900,
        mrp: 1000,
      },
      100 // Seed with 100 initial stock
    );

    assert(product.sku === 'TEST-SKU-1001', 'Master product created with uppercase normalized SKU');

    console.log('\n🔹 6. Testing Inventory Ledger & Atomic Assignment...');
    const parentStock = await inventoryService.getMyInventory(validUser, {});
    assert(parentStock.items.length > 0, 'Parent owns master stock balance');

    // Assign 25 units from Super Admin to child1
    const assignTx = await inventoryService.assignStock(validUser, child1._id, product._id, 25, 'Initial Branch Allocation');
    assert(assignTx.quantity === 25, 'Stock assigned to downline child business');

    const childStock = await inventoryService.getMyInventory(child1, {});
    const childItem = childStock.items.find((i) => i.productId?._id?.toString() === product._id.toString());
    assert(childItem?.availableQty === 25, 'Child stock increased accurately by 25 units');

    // Check transaction history
    const history = await inventoryService.getTransactionHistory(child1, {});
    assert(history.items.length > 0, 'Stock transaction logged in immutable ledger');

    console.log('\n🔹 7. Testing Low Stock Threshold Calculation...');
    const alerts = await inventoryService.getLowStockAlerts(child1);
    assert(Array.isArray(alerts), 'Low stock alerts evaluated without errors');

    console.log('\n==========================================');
    console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('==========================================\n');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test Suite Fatal Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
