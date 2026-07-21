import { ProductService } from '../service/product.service.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

export class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  createProduct = async (req, res, next) => {
    try {
      const { initialStockQty, ...productData } = req.body;
      const product = await this.productService.createMasterProduct(req.user, productData, initialStockQty);
      return ApiResponse.created(res, 'Master product created', product);
    } catch (error) {
      next(error);
    }
  };

  getProducts = async (req, res, next) => {
    try {
      const result = await this.productService.getProducts(req.user, req.query);
      return ApiResponse.success(res, 'Products list fetched', result.items, {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req, res, next) => {
    try {
      const product = await this.productService.getProductById(req.params.id);
      return ApiResponse.success(res, 'Product details fetched', product);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req, res, next) => {
    try {
      const updated = await this.productService.updateProduct(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Product updated', updated);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req, res, next) => {
    try {
      const cat = await this.productService.createCategory(req.body);
      return ApiResponse.created(res, 'Category created', cat);
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req, res, next) => {
    try {
      const categories = await this.productService.getCategories();
      return ApiResponse.success(res, 'Categories fetched', categories);
    } catch (error) {
      next(error);
    }
  };

  createBrand = async (req, res, next) => {
    try {
      const brand = await this.productService.createBrand(req.body);
      return ApiResponse.created(res, 'Brand created', brand);
    } catch (error) {
      next(error);
    }
  };

  getBrands = async (req, res, next) => {
    try {
      const brands = await this.productService.getBrands();
      return ApiResponse.success(res, 'Brands fetched', brands);
    } catch (error) {
      next(error);
    }
  };
}
