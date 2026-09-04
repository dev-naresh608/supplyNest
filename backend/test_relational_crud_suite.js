import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5000;

async function runTests() {
  console.log('============================================================');
  console.log('   STARTING SUPPLYNEST RELATIONAL CRUD SAFEGUARDS TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Super Admin
    const loginRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@invora.com', password: 'SuperAdmin@2026!' }
    );

    assert(loginRes.status === 200 && loginRes.body?.data?.accessToken, 'Super Admin Authentication');
    const adminToken = loginRes.body?.data?.accessToken;
    const authHeader = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };


    // 2. Create Category
    const uniqueSuffix = Date.now();
    const catRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/products/categories',
        method: 'POST',
        headers: authHeader,
      },
      { name: `Test Category ${uniqueSuffix}`, description: 'For relational delete test' }
    );
    assert(catRes.status === 201 && catRes.body?.data?._id, 'Super Admin Create Category');
    const categoryId = catRes.body?.data?._id;

    // 3. Create Brand
    const brandRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/products/brands',
        method: 'POST',
        headers: authHeader,
      },
      { name: `Brand_${uniqueSuffix}`, description: 'Test Brand' }
    );
    assert(brandRes.status === 201 && brandRes.body?.data?._id, 'Super Admin Create Brand');
    const brandId = brandRes.body?.data?._id;

    // 4. Create Master Product with stock = 25
    const skuCode = `REL-${uniqueSuffix}`;
    const prodRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/products',
        method: 'POST',
        headers: authHeader,
      },
      {
        productName: `Relational Safety Item ${uniqueSuffix}`,
        sku: skuCode,
        category: categoryId,
        brand: brandId,
        costPrice: 50,
        purchasePrice: 60,
        sellingPrice: 100,
        mrp: 120,
        initialStockQty: 25,
      }
    );
    assert(prodRes.status === 201 && prodRes.body?.data?._id, 'Super Admin Create Master Product with Initial Stock');
    const productId = prodRes.body?.data?._id;

    // 5. Safeguard Test: Attempt to delete product while stock > 0
    const deleteBlockedRes = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/products/${productId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(
      deleteBlockedRes.status === 400 && deleteBlockedRes.body?.message?.includes('active inventory'),
      'Product Deletion BLOCKED when Active Stock > 0',
      JSON.stringify(deleteBlockedRes.body)
    );

    // 6. Safeguard Test: Attempt to delete category while product is linked
    const deleteCatBlocked = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/products/categories/${categoryId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(
      deleteCatBlocked.status === 400 && deleteCatBlocked.body?.message?.includes('active product(s) are currently linked'),
      'Category Deletion BLOCKED when active products are assigned',
      JSON.stringify(deleteCatBlocked.body)
    );

    // 7. Safeguard Test: Attempt to delete brand while product is linked
    const deleteBrandBlocked = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/products/brands/${brandId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(
      deleteBrandBlocked.status === 400 && deleteBrandBlocked.body?.message?.includes('active product(s) are currently linked'),
      'Brand Deletion BLOCKED when active products are assigned',
      JSON.stringify(deleteBrandBlocked.body)
    );

    // 8. Relational Test: Adjust product stock to 0 and re-test deletion
    const adjustRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/inventory/adjust',
        method: 'POST',
        headers: authHeader,
      },
      {
        productId,
        quantity: 25,
        type: 'DAMAGE',
        notes: 'Clearing stock for safe deletion test',
      }
    );
    assert(adjustRes.status === 200, 'Adjusted product stock out', JSON.stringify(adjustRes.body));


    // 9. Now delete product (should succeed and preserve historical transactions)
    const deleteProdSuccess = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/products/${productId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(
      deleteProdSuccess.status === 200 && deleteProdSuccess.body?.data?.deleted === true,
      'Product Deletion SUCCEEDS once stock is 0 (Historical Audit Preserved)',
      JSON.stringify(deleteProdSuccess.body)
    );

    // 10. Now delete category and brand (should succeed now that product is deleted)
    const deleteCatSuccess = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/products/categories/${categoryId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(deleteCatSuccess.status === 200, 'Category Deletion SUCCEEDS once unlinked');

    const deleteBrandSuccess = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/products/brands/${brandId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(deleteBrandSuccess.status === 200, 'Brand Deletion SUCCEEDS once unlinked');

    // 11. Role Relational Tests: Create Role -> Assign Staff -> Test Delete Block
    const roleRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/roles',
        method: 'POST',
        headers: authHeader,
      },
      {
        roleName: `Relational Tester Role ${uniqueSuffix}`,
        description: 'Test Role for assigned staff block',
        permissions: { products: { view: true, create: false } },
      }
    );
    assert(roleRes.status === 201 && roleRes.body?.data?._id, 'Create Custom Role');
    const roleId = roleRes.body?.data?._id;

    // Create Staff user
    const staffRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/hierarchy/children',
        method: 'POST',
        headers: authHeader,
      },
      {
        firstName: 'Staff',
        lastName: `Member_${uniqueSuffix}`,
        email: `staff_${uniqueSuffix}@example.com`,
        password: 'Password@123',
        userType: 'STAFF',
      }
    );
    assert(staffRes.status === 201 && staffRes.body?.data?._id, 'Create Staff User');
    const staffId = staffRes.body?.data?._id;

    // Assign Role to Staff
    const assignRes = await makeRequest(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: '/api/v1/roles/assign',
        method: 'POST',
        headers: authHeader,
      },
      { staffUserId: staffId, roleId }
    );
    assert(assignRes.status === 200, 'Assign Role to Staff');

    // Attempt to delete role (should be blocked)
    const deleteRoleBlocked = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/roles/${roleId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(
      deleteRoleBlocked.status === 400 && deleteRoleBlocked.body?.message?.includes('currently assigned to 1 active staff member'),
      'Role Deletion BLOCKED when staff is assigned',
      JSON.stringify(deleteRoleBlocked.body)
    );

    // Delete staff node (should succeed and revoke sessions)
    const deleteStaffSuccess = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/hierarchy/children/${staffId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(deleteStaffSuccess.status === 200, 'Staff Node Deletion SUCCEEDS');

    // Now delete role (should succeed)
    const deleteRoleSuccess = await makeRequest({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/v1/roles/${roleId}`,
      method: 'DELETE',
      headers: authHeader,
    });
    assert(deleteRoleSuccess.status === 200, 'Role Deletion SUCCEEDS after staff is unassigned/deleted');

    console.log('\n============================================================');
    console.log('      SUPPLYNEST RELATIONAL SAFEGUARDS TEST SUMMARY');
    console.log('============================================================');
    console.log(`Total Passed: ${passed}`);
    console.log(`Total Failed: ${failed}`);
    console.log(`Status:       ${failed === 0 ? 'ALL SAFEGUARDS VERIFIED!' : 'FAILURES DETECTED'}`);
    console.log('============================================================\n');
  } catch (err) {
    console.error('Fatal test execution error:', err);
  }
}

runTests();
