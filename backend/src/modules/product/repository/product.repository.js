import { Product } from '../model/Product.js';
import { Category, Brand } from '../model/Category.js';

export class ProductRepository {
  async createProduct(data) {
    const product = new Product(data);
    return await product.save();
  }

  async findById(id) {
    return await Product.findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name logo')
      .exec();
  }

  async findProducts(filter = {}, options = {}) {
    const query = { ...filter, isDeleted: false };
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('brand', 'name')
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProduct(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async createCategory(data) {
    return await Category.create(data);
  }

  async getCategories() {
    return await Category.find({ isActive: true }).populate('parentCategory', 'name').exec();
  }

  async createBrand(data) {
    return await Brand.create(data);
  }

  async getBrands() {
    return await Brand.find({ isActive: true }).exec();
  }
}
