import { ProductRepository } from '../repository/product.repository.js';
import { InventoryRepository } from '../../inventory/repository/inventory.repository.js';
import { Inventory } from '../../inventory/model/Inventory.js';
import { StockTransaction } from '../../inventory/model/StockTransaction.js';
import { Category, Brand } from '../model/Category.js';
import { ApiError } from '../../../utils/ApiError.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';
import { Product } from '../model/Product.js';
import { escapeRegex } from '../../../utils/helpers.js';

export class ProductService {
  constructor() {
    this.productRepo = new ProductRepository();
    this.inventoryRepo = new InventoryRepository();
  }

  async createMasterProduct(currentUser, productData, initialStockQty = 0) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can create master products');
    }

    const normalizedSku = productData.sku.trim().toUpperCase();
    const existingSku = await Product.findOne({ sku: normalizedSku, isDeleted: false });
    if (existingSku) {
      throw ApiError.conflict(`Product with SKU "${normalizedSku}" already exists`);
    }

    const cleanBarcode =
      productData.barcode && typeof productData.barcode === 'string' && productData.barcode.trim() !== ''
        ? productData.barcode.trim()
        : undefined;

    const productPayload = {
      ...productData,
      sku: normalizedSku,
      createdBy: currentUser._id,
    };

    if (cleanBarcode) {
      productPayload.barcode = cleanBarcode;
    } else {
      delete productPayload.barcode;
    }

    const product = await this.productRepo.createProduct(productPayload);

    // Automatically seed root inventory for Super Admin if initialStockQty > 0
    if (initialStockQty > 0) {
      await this.inventoryRepo.upsertStock(currentUser._id, product._id, initialStockQty);
      await this.inventoryRepo.createTransaction({
        productId: product._id,
        fromOwnerId: null,
        toOwnerId: currentUser._id,
        quantity: initialStockQty,
        transactionType: 'OPENING_STOCK',
        notes: 'Initial master stock added by Super Admin',
        performedBy: currentUser._id,
      });
    }

    return product;
  }

  async getProducts(currentUser, queryParams) {
    const filter = {};
    if (queryParams.search && typeof queryParams.search === 'string' && queryParams.search.trim()) {
      const sanitized = escapeRegex(queryParams.search.trim());
      filter.$or = [
        { productName: { $regex: sanitized, $options: 'i' } },
        { sku: { $regex: sanitized, $options: 'i' } },
      ];
    }
    if (queryParams.category) filter.category = queryParams.category;
    if (queryParams.brand) filter.brand = queryParams.brand;
    if (queryParams.status) filter.status = queryParams.status;

    return await this.productRepo.findProducts(filter, queryParams);
  }

  async getProductById(productId) {
    const product = await this.productRepo.findById(productId);
    if (!product || product.isDeleted) throw ApiError.notFound('Product not found');
    return product;
  }

  async updateProduct(productId, updateData, currentUser) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can update master products');
    }

    if (updateData.sku) {
      updateData.sku = updateData.sku.trim().toUpperCase();
      const existingSku = await Product.findOne({
        sku: updateData.sku,
        _id: { $ne: productId },
        isDeleted: false,
      });
      if (existingSku) {
        throw ApiError.conflict(`Another product with SKU "${updateData.sku}" already exists`);
      }
    }

    if (updateData.barcode !== undefined) {
      if (updateData.barcode && typeof updateData.barcode === 'string' && updateData.barcode.trim() !== '') {
        updateData.barcode = updateData.barcode.trim();
      } else {
        delete updateData.barcode;
        updateData.$unset = { ...updateData.$unset, barcode: 1 };
      }
    }

    const updated = await this.productRepo.updateProduct(productId, updateData);
    if (!updated) throw ApiError.notFound('Product not found');
    return updated;
  }

  async deleteProduct(productId, currentUser) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can delete master products');
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted) {
      throw ApiError.notFound('Product not found');
    }

    // 1. Check for active inventory balances across all nodes/warehouses
    const activeInventories = await Inventory.find({
      productId,
      $or: [{ availableQty: { $gt: 0 } }, { reservedQty: { $gt: 0 } }],
    });

    if (activeInventories.length > 0) {
      const totalAvailable = activeInventories.reduce((sum, inv) => sum + (inv.availableQty || 0), 0);
      const totalReserved = activeInventories.reduce((sum, inv) => sum + (inv.reservedQty || 0), 0);
      throw ApiError.badRequest(
        `Cannot delete product "${product.productName}" (SKU: ${product.sku}) because there is active inventory (${totalAvailable} available, ${totalReserved} reserved) across ${activeInventories.length} business location(s). Please adjust or transfer stock to 0 before deleting.`
      );
    }

    // 2. Check if product has historical transactions in StockLedger
    const historyCount = await StockTransaction.countDocuments({ productId });

    // Mark product as deleted to preserve historical ledger records if any exist
    product.isDeleted = true;
    product.status = 'DELETED';
    await product.save();

    // Clean zero-stock inventory records to keep DB tidy
    await Inventory.deleteMany({ productId, availableQty: 0, reservedQty: 0, damagedQty: 0 });

    return {
      deleted: true,
      productName: product.productName,
      sku: product.sku,
      historicalRecordsPreserved: historyCount,
    };
  }

  async createCategory(data) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await Category.findOne({ slug });
    if (existing) {
      throw ApiError.conflict(`Category "${data.name}" already exists`);
    }
    return await this.productRepo.createCategory({ ...data, slug });
  }

  async getCategories() {
    return await this.productRepo.getCategories();
  }

  async updateCategory(id, data, currentUser) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can manage categories');
    }

    const category = await this.productRepo.findCategoryById(id);
    if (!category) throw ApiError.notFound('Category not found');

    if (data.name && data.name !== category.name) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    return await this.productRepo.updateCategory(id, data);
  }

  async deleteCategory(id, currentUser) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can manage categories');
    }

    const category = await this.productRepo.findCategoryById(id);
    if (!category) throw ApiError.notFound('Category not found');

    // Check linked active products
    const linkedProductsCount = await Product.countDocuments({ category: id, isDeleted: false });
    if (linkedProductsCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${category.name}" because ${linkedProductsCount} active product(s) are currently linked to it. Please reassign or delete those products first.`
      );
    }

    // Check linked subcategories
    const childCategoriesCount = await Category.countDocuments({ parentCategory: id });
    if (childCategoriesCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete category "${category.name}" because ${childCategoriesCount} child sub-category/categories are linked under it.`
      );
    }

    await this.productRepo.deleteCategory(id);
    return { deleted: true, name: category.name };
  }

  async createBrand(data) {
    const existing = await Brand.findOne({ name: data.name.trim() });
    if (existing) {
      throw ApiError.conflict(`Brand "${data.name}" already exists`);
    }
    return await this.productRepo.createBrand(data);
  }

  async getBrands() {
    return await this.productRepo.getBrands();
  }

  async updateBrand(id, data, currentUser) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can manage brands');
    }

    const brand = await this.productRepo.findBrandById(id);
    if (!brand) throw ApiError.notFound('Brand not found');

    return await this.productRepo.updateBrand(id, data);
  }

  async deleteBrand(id, currentUser) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can manage brands');
    }

    const brand = await this.productRepo.findBrandById(id);
    if (!brand) throw ApiError.notFound('Brand not found');

    // Check linked active products
    const linkedProductsCount = await Product.countDocuments({ brand: id, isDeleted: false });
    if (linkedProductsCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete brand "${brand.name}" because ${linkedProductsCount} active product(s) are currently linked to it. Please reassign or delete those products first.`
      );
    }

    await this.productRepo.deleteBrand(id);
    return { deleted: true, name: brand.name };
  }
}

