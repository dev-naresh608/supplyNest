import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Search, Filter, Tag, DollarSign, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductsView = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const loadData = async () => {
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
        api.get('/products/brands'),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
    } catch (err) {
      toast.error('Failed to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        ...form,
        costPrice: Number(form.costPrice),
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        mrp: Number(form.mrp),
        initialStockQty: Number(form.initialStockQty),
      });
      toast.success('Master product created successfully');
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Master Product Catalog</h2>
          <p className="text-xs text-slate-400">Master products owned and managed across distribution levels</p>
        </div>

        {user?.userType === 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Master Product
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((prod) => (
          <div key={prod._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                <Package className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold uppercase">
                  {prod.sku}
                </span>
                <h3 className="text-base font-bold text-white truncate mt-1">{prod.productName}</h3>
                <p className="text-xs text-slate-400">{prod.category?.name || 'Category'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Selling Price</span>
                <span className="font-bold text-emerald-400">₹{prod.sellingPrice}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block">MRP</span>
                <span className="font-bold text-slate-300 line-through">₹{prod.mrp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white font-['Outfit']">Create Master Product</h3>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Product Name</label>
                  <input
                    type="text"
                    required
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Category</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Brand</label>
                  <select
                    required
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400">Cost Price</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Selling Price</label>
                  <input
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={form.initialStockQty}
                    onChange={(e) => setForm({ ...form, initialStockQty: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl glow-btn text-white font-semibold">
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
