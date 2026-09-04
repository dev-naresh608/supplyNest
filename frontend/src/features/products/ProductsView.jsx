import React, { useState } from 'react';
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useCreateProductMutation,
  useDeleteProductMutation,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateBrandMutation,
  useDeleteBrandMutation,
} from '../../store/api/productsApi';
import { useSelector } from 'react-redux';
import { Package, Plus, X, Tag, Trash2, Layers, Award, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductsView = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN';

  const { data: products = [], isLoading: isProductsLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();

  const [createProductApi, { isLoading: isCreatingProduct }] = useCreateProductMutation();
  const [deleteProductApi] = useDeleteProductMutation();
  const [createCategoryApi] = useCreateCategoryMutation();
  const [deleteCategoryApi] = useDeleteCategoryMutation();
  const [createBrandApi] = useCreateBrandMutation();
  const [deleteBrandApi] = useDeleteBrandMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTab, setManageTab] = useState('categories'); // 'categories' | 'brands'
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  const [form, setForm] = useState({
    productName: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    description: '',
    costPrice: 100,
    purchasePrice: 120,
    sellingPrice: 180,
    mrp: 200,
    initialStockQty: 50,
  });

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await createProductApi({
        ...form,
        costPrice: Number(form.costPrice),
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp),
        initialStockQty: Number(form.initialStockQty),
      }).unwrap();
      toast.success('Master product created successfully');
      setShowCreateModal(false);
      setForm({
        productName: '',
        sku: '',
        barcode: '',
        category: '',
        brand: '',
        description: '',
        costPrice: 100,
        purchasePrice: 120,
        sellingPrice: 180,
        mrp: 200,
        initialStockQty: 50,
      });
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (product) => {
    try {
      await deleteProductApi(product._id).unwrap();
      toast.success(`Product "${product.productName}" deleted successfully`);
      setDeleteConfirmTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete product', { duration: 5000 });
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await createCategoryApi({ name: newCatName.trim() }).unwrap();
      toast.success('Category created');
      setNewCatName('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (cat) => {
    try {
      await deleteCategoryApi(cat._id).unwrap();
      toast.success(`Category "${cat.name}" deleted`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete category', { duration: 5000 });
    }
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      await createBrandApi({ name: newBrandName.trim() }).unwrap();
      toast.success('Brand created');
      setNewBrandName('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to create brand');
    }
  };

  const handleDeleteBrand = async (brand) => {
    try {
      await deleteBrandApi(brand._id).unwrap();
      toast.success(`Brand "${brand.name}" deleted`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete brand', { duration: 5000 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Master Product Catalog</h2>
          <p className="text-xs text-slate-500 font-medium">Master products owned and managed across distribution levels</p>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowManageModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              Categories & Brands
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Master Product
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
            No master products registered in catalog.
          </div>
        ) : (
          products.map((prod) => (
            <div key={prod._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-4 relative group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    <Package className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                      {prod.sku}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 truncate mt-1.5">{prod.productName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{prod.category?.name || 'General Category'}</p>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => setDeleteConfirmTarget(prod)}
                    className="opacity-80 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">Selling Price</span>
                  <span className="font-bold text-emerald-700 text-sm">₹{prod.sellingPrice}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block">MRP</span>
                  <span className="font-bold text-slate-400 line-through text-sm">₹{prod.mrp}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Product Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Delete Product</h4>
                <p className="text-xs text-slate-500">Confirm permanent deletion or archiving</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmTarget.productName}</strong> ({deleteConfirmTarget.sku})?
              If active inventory stock is held at any node, the system will prevent deletion to preserve data integrity.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmTarget)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories & Brands Management Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">Catalog Classifications</h3>
                <p className="text-xs text-slate-500 font-medium">Manage master product categories and authorized brands</p>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-100 gap-4 text-xs font-bold">
              <button
                onClick={() => setManageTab('categories')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  manageTab === 'categories'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                onClick={() => setManageTab('brands')}
                className={`pb-2.5 transition border-b-2 cursor-pointer ${
                  manageTab === 'brands'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Brands ({brands.length})
              </button>
            </div>

            {manageTab === 'categories' ? (
              <div className="space-y-4">
                <form onSubmit={handleCreateCategory} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="New category name..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 transition"
                  />
                  <button type="submit" className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold shrink-0 cursor-pointer">
                    Add
                  </button>
                </form>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {categories.map((cat) => (
                    <div key={cat._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleCreateBrand} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="New brand name..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 transition"
                  />
                  <button type="submit" className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold shrink-0 cursor-pointer">
                    Add
                  </button>
                </form>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {brands.map((brand) => (
                    <div key={brand._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{brand.name}</span>
                      <button
                        onClick={() => handleDeleteBrand(brand)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">Create Master Product</h3>
                <p className="text-xs text-slate-500 font-medium">Define root master SKU specifications & baseline pricing</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Category</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  >
                    <option value="" className="bg-white text-slate-900">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id} className="bg-white text-slate-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Brand</label>
                  <select
                    required
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  >
                    <option value="" className="bg-white text-slate-900">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id} className="bg-white text-slate-900">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Cost Price</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Selling Price</label>
                  <input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={form.initialStockQty}
                    onChange={(e) => setForm({ ...form, initialStockQty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl glow-btn text-white font-semibold cursor-pointer">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

