import React, { useState } from 'react';
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useCreateProductMutation,
  useCreateCategoryMutation,
  useCreateBrandMutation,
} from '../../store/api/productsApi';
import { useSelector } from 'react-redux';
import { Package, Plus, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductsView = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: products = [], isLoading: isProductsLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: brands = [] } = useGetBrandsQuery();

  const [createProductApi, { isLoading: isCreatingProduct }] = useCreateProductMutation();
  const [createCategoryApi] = useCreateCategoryMutation();
  const [createBrandApi] = useCreateBrandMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

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

  const handleQuickCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await createCategoryApi({ name: newCatName.trim() }).unwrap();
      toast.success('Category created');
      setForm((prev) => ({ ...prev, category: cat._id }));
      setNewCatName('');
      setShowCategoryModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to create category');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Master Product Catalog</h2>
          <p className="text-xs text-slate-500 font-medium">Master products owned and managed across distribution levels</p>
        </div>

        {user?.userType === 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Master Product
          </button>
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
            <div key={prod._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-4">
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
