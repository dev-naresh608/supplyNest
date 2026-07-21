import { ProductRepository } from '../repository/product.repository.js';
import { InventoryRepository } from '../../inventory/repository/inventory.repository.js';
import { ApiError } from '../../../utils/ApiError.js';
import { SYSTEM_USER_TYPES } from '../../../constants/userRoles.js';

export class ProductService {
  constructor() {
    this.productRepo = new ProductRepository();
    this.inventoryRepo = new InventoryRepository();
  }

  async createMasterProduct(currentUser, productData, initialStockQty = 0) {
    if (currentUser.userType !== SYSTEM_USER_TYPES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can create master products');
    }

    const existingSku = await this.productRepo.findProducts({ sku: productData.sku });
    if (existingSku.items.length > 0) {
      throw ApiError.conflict(`Product with SKU "${productData.sku}" already exists`);
    }

    const product = await this.productRepo.createProduct({
      ...productData,
      createdBy: currentUser._id,
    });

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
    if (queryParams.search) {
      filter.$or = [
        { productName: { $regex: queryParams.search, $options: 'i' } },
        { sku: { $regex: queryParams.search, $options: 'i' } },
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
    const updated = await this.productRepo.updateProduct(productId, updateData);
    return updated;
  }

  async createCategory(data) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return await this.productRepo.createCategory({ ...data, slug });
  }

  async getCategories() {
    return await this.productRepo.getCategories();
  }

  async createBrand(data) {
    return await this.productRepo.createBrand(data);
  }

  async getBrands() {
    return await this.productRepo.getBrands();
  }
}
