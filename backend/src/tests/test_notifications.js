import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../modules/auth/model/User.js';
import { Product } from '../modules/product/model/Product.js';
import { Inventory } from '../modules/inventory/model/Inventory.js';
import { Notification } from '../modules/notification/model/Notification.js';
import { NotificationService } from '../modules/notification/service/notification.service.js';
import { InventoryService } from '../modules/inventory/service/inventory.service.js';
import { HierarchyService } from '../modules/hierarchy/service/hierarchy.service.js';
import { Role } from '../modules/role/model/Role.js';
import { SYSTEM_USER_TYPES } from '../constants/userRoles.js';

async function runTests() {
  console.log('🔄 Connecting to MongoDB for End-to-End Notification Testing...');
  await mongoose.connect(ENV.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const notificationService = new NotificationService();
  const inventoryService = new InventoryService();
  const hierarchyService = new HierarchyService();

  // 1. Get or create SuperAdmin and test business user
  const admin = await User.findOne({ userType: SYSTEM_USER_TYPES.SUPER_ADMIN, isDeleted: false });
  if (!admin) {
    throw new Error('SuperAdmin not found. Please seed database first.');
  }
  console.log(`👤 Admin found: ${admin.email} (${admin._id})`);

  // Find or create a test child user
  let childUser = await User.findOne({ parentUser: admin._id, isDeleted: false });
  let role = await Role.findOne({ parentBusiness: admin._id, isDeleted: false });

  if (!role) {
    role = await Role.create({
      roleName: 'Test Distributor Role',
      description: 'Test role for notifications',
      parentBusiness: admin._id,
      createdBy: admin._id,
      status: 'ACTIVE',
      permissions: {
        products: { view: true },
        inventory: { view: true, create: true, update: true },
      },
    });
  }

  if (!childUser) {
    childUser = await hierarchyService.createChildUser(admin, {
      firstName: 'Test',
      lastName: 'Partner',
      email: `partner_${Date.now()}@invora.com`,
      password: 'password123',
      phone: '9876543210',
      role: role._id,
    });
    console.log(`👤 Created test child user: ${childUser.email} (${childUser._id})`);
  } else {
    console.log(`👤 Using existing child user: ${childUser.email} (${childUser._id})`);
  }

  // 2. Clean previous test notifications for these users
  await Notification.deleteMany({ recipient: { $in: [admin._id, childUser._id] } });
  console.log('🧹 Cleaned previous test notifications');

  // 3. Test: Unread count starts at 0
  let unreadAdmin = await notificationService.getUnreadCount(admin._id);
  let unreadChild = await notificationService.getUnreadCount(childUser._id);
  console.log(`📊 Initial unread counts -> Admin: ${unreadAdmin.unreadCount}, Child: ${unreadChild.unreadCount}`);
  if (unreadAdmin.unreadCount !== 0 || unreadChild.unreadCount !== 0) {
    throw new Error('Initial unread count should be 0');
  }

  // 4. Test: Stock Assignment Trigger -> Generates Notification for Child
  let product = await Product.findOne({ isDeleted: false });
  if (!product) {
    product = await Product.create({
      productName: 'Notification Test Router Pro',
      sku: `NOTIF-${Date.now()}`,
      barcode: `${Date.now()}`,
      sellingPrice: 199,
      purchasePrice: 100,
      minStockThreshold: 5,
    });
  }

  // Ensure admin has stock to assign
  await inventoryService.adjustStock(admin, product._id, 100, 'STOCK_IN', 'Seeding test stock');

  console.log(`📦 Assigning 10 units of "${product.productName}" from Admin to Child...`);
  await inventoryService.assignStock(admin, childUser._id, product._id, 10, 'Allocation test batch');

  // Wait a brief moment for async trigger
  await new Promise((r) => setTimeout(r, 500));

  // Verify child received notification
  const childFeed = await notificationService.getUserNotifications(childUser._id);
  console.log(`📬 Child notifications count: ${childFeed.items.length}`);
  const stockNotif = childFeed.items.find((n) => n.type === 'STOCK_ASSIGNMENT');
  if (!stockNotif) {
    throw new Error('Expected STOCK_ASSIGNMENT notification not found in child feed');
  }
  console.log(`✅ Received stock allocation notification: "${stockNotif.title}" - "${stockNotif.message}"`);

  // Verify child unread count incremented
  unreadChild = await notificationService.getUnreadCount(childUser._id);
  console.log(`📊 Child unread count is now: ${unreadChild.unreadCount}`);
  if (unreadChild.unreadCount !== 1) {
    throw new Error(`Expected child unread count 1, got ${unreadChild.unreadCount}`);
  }

  // 5. Test: Stock Adjustment Request from Child -> Generates Notification for Super Admin
  console.log(`📝 Child requesting adjustment for 2 units damage...`);
  const adjustResult = await inventoryService.adjustStock(childUser, product._id, 2, 'DAMAGE', 'Damaged in transit');

  await new Promise((r) => setTimeout(r, 500));

  const adminFeed = await notificationService.getUserNotifications(admin._id);
  const requestNotif = adminFeed.items.find((n) => n.type === 'STOCK_ADJUSTMENT_REQUEST');
  if (!requestNotif) {
    throw new Error('Expected STOCK_ADJUSTMENT_REQUEST notification not found in admin feed');
  }
  console.log(`✅ SuperAdmin received approval request notification: "${requestNotif.title}" - "${requestNotif.message}"`);

  // 6. Test: Super Admin Reviews (Approves) Request -> Generates Notification for Child
  console.log(`⚖️ SuperAdmin approving adjustment request ID ${adjustResult.request._id}...`);
  await inventoryService.reviewAdjustmentRequest(admin, adjustResult.request._id, 'APPROVE', 'Approved by lead admin');

  await new Promise((r) => setTimeout(r, 500));

  const childFeed2 = await notificationService.getUserNotifications(childUser._id);
  const approvalNotif = childFeed2.items.find((n) => n.type === 'STOCK_ADJUSTMENT_APPROVED');
  if (!approvalNotif) {
    throw new Error('Expected STOCK_ADJUSTMENT_APPROVED notification not found in child feed');
  }
  console.log(`✅ Child received approval decision notification: "${approvalNotif.title}" - "${approvalNotif.message}"`);

  // 7. Test: Mark Single as Read
  console.log(`👆 Marking notification ${stockNotif._id} as read...`);
  await notificationService.markAsRead(childUser._id, stockNotif._id);
  const updatedChildCount = await notificationService.getUnreadCount(childUser._id);
  console.log(`📊 Child unread count after marking 1 as read: ${updatedChildCount.unreadCount}`);
  if (updatedChildCount.unreadCount !== childFeed2.items.length - 1) {
    throw new Error('Unread count did not decrement correctly');
  }

  // 8. Test: Mark All as Read
  console.log(`👆 Marking all child notifications as read...`);
  await notificationService.markAllAsRead(childUser._id);
  const zeroChildCount = await notificationService.getUnreadCount(childUser._id);
  console.log(`📊 Child unread count after mark all read: ${zeroChildCount.unreadCount}`);
  if (zeroChildCount.unreadCount !== 0) {
    throw new Error(`Expected unread count 0, got ${zeroChildCount.unreadCount}`);
  }

  // 9. Test: Clear Read Notifications
  console.log(`🗑️ Clearing read notifications...`);
  const clearedResult = await notificationService.clearAllRead(childUser._id);
  console.log(`✅ Cleared ${clearedResult.deletedCount} read notifications`);

  const remainingFeed = await notificationService.getUserNotifications(childUser._id);
  console.log(`📬 Remaining notifications for child: ${remainingFeed.items.length}`);
  if (remainingFeed.items.length !== 0) {
    throw new Error('Expected 0 remaining notifications after clearing all read');
  }

  // 10. Seed 3 rich sample notifications for SuperAdmin so UI demo looks fantastic!
  await notificationService.repo.createMany([
    {
      recipient: admin._id,
      title: 'Global Stock Inward Processed',
      message: 'Batch #INV-7729 inwarded 500 units of "Invora Edge Router X100" into Central Distribution Hub.',
      type: 'STOCK_ASSIGNMENT',
      category: 'INVENTORY',
      severity: 'SUCCESS',
      link: '/inventory',
      isRead: false,
    },
    {
      recipient: admin._id,
      title: 'Regional Low Stock Warning',
      message: 'Safety threshold alert: North Hub is down to 3 units for "Smart Accessories Cables".',
      type: 'LOW_STOCK_ALERT',
      category: 'INVENTORY',
      severity: 'WARNING',
      link: '/inventory',
      isRead: false,
    },
    {
      recipient: admin._id,
      title: 'Security Session Monitored',
      message: 'New enterprise login session established from Chrome / Windows on 127.0.0.1.',
      type: 'SECURITY_ALERT',
      category: 'SECURITY',
      severity: 'INFO',
      link: '/sessions',
      isRead: false,
    },
  ]);
  console.log('🌟 Seeded 3 rich live notifications for Super Admin demo');

  console.log('\n========================================');
  console.log('🎉 ALL NOTIFICATION UNIT & E2E TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Notification test failed:', err);
  process.exit(1);
});
