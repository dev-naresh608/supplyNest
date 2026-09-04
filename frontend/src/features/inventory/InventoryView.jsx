import React, { useState } from 'react';
import {
  useGetMyStockQuery,
  useGetTransactionHistoryQuery,
  useAssignStockMutation,
  useAdjustStockMutation,
} from '../../store/api/inventoryApi';
import { useGetDownlineQuery } from '../../store/api/hierarchyApi';
import { useSelector } from 'react-redux';
import { Send, Sliders, X, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryView = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: stockItems = [], isLoading: isStockLoading } = useGetMyStockQuery();
  const { data: history = [], isLoading: isHistoryLoading } = useGetTransactionHistoryQuery();
  const { data: downlineList = [] } = useGetDownlineQuery();

  const [assignStockApi, { isLoading: isAssigning }] = useAssignStockMutation();
  const [adjustStockApi, { isLoading: isAdjusting }] = useAdjustStockMutation();

  const [activeTab, setActiveTab] = useState('stock');

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [childId, setChildId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustType, setAdjustType] = useState(user?.userType === 'SUPER_ADMIN' ? 'STOCK_IN' : 'ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState('');

  const handleAssignStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const targetChild = childId || downlineList[0]?._id;
    if (!targetChild) {
      toast.error('Please select a target downline business');
      return;
    }

    try {
      await assignStockApi({
        childId: targetChild,
        productId: selectedProduct.productId?._id,
        quantity: Number(quantity),
        notes,
      }).unwrap();
      toast.success('Stock assigned successfully');
      setShowAssignModal(false);
      setNotes('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Stock assignment failed');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustProduct) return;

    try {
      await adjustStockApi({
        productId: adjustProduct.productId?._id,
        quantity: Number(adjustQty),
        type: adjustType,
        notes: adjustNotes,
      }).unwrap();
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      setAdjustNotes('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Stock adjustment failed');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Inventory & Distribution Ledger</h2>
          <p className="text-xs text-slate-500 font-medium">Track owned stock balances and downline stock assignments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'stock' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Available Stock
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Immutable Transaction History ({history.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stock' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stockItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
              No inventory stock items found.
            </div>
          ) : (
            stockItems.map((item) => (
              <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.productId?.productName}</h3>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80">
                      SKU: {item.productId?.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-indigo-600 font-['Outfit']">{item.availableQty}</span>
                    <span className="text-[10px] block font-semibold text-slate-500">Available Pcs</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Reserved: <span className="text-slate-800 font-semibold">{item.reservedQty}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAdjustProduct(item);
                        setShowAdjustModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Adjust
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(item);
                        setShowAssignModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Assign
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">From Business</th>
                  <th className="p-3.5">To Business</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400 font-medium">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-semibold text-slate-900">{tx.productId?.productName}</td>
                      <td className="p-3.5 text-slate-500 font-medium">{tx.fromOwnerId ? tx.fromOwnerId.email : 'System Root'}</td>
                      <td className="p-3.5 text-indigo-600 font-medium">{tx.toOwnerId?.email}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-semibold">
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{tx.quantity}</td>
                      <td className="p-3.5 text-slate-500 font-medium">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Stock Modal */}
      {showAssignModal && selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Assign Stock to Downline</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Product: <span className="text-indigo-600 font-semibold">{selectedProduct.productId?.productName}</span> (Max Available: {selectedProduct.availableQty})
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStock} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Target Downline Business</label>
                {downlineList.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    No downline businesses found. Go to <strong>Business Hierarchy → Add Child Business</strong> to create one first.
                  </div>
                ) : (
                  <select
                    required
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  >
                    {downlineList.map((child) => (
                      <option key={child._id} value={child._id} className="bg-white text-slate-900">
                        {child.firstName} {child.lastName} ({child.email}) - Level {child.hierarchyLevel}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Quantity to Transfer</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedProduct.availableQty}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="Optional reference note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={downlineList.length === 0}
                  className="px-5 py-2 rounded-xl glow-btn text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  Execute Stock Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && adjustProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Stock Adjustment</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Product: <span className="text-indigo-600 font-semibold">{adjustProduct.productId?.productName}</span> (Current: {adjustProduct.availableQty})
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                >
                  {user?.userType === 'SUPER_ADMIN' && <option value="STOCK_IN">Stock In (Master Receive)</option>}
                  <option value="ADJUSTMENT">Stock Adjustment (+ Add)</option>
                  <option value="DAMAGE">Mark as Damaged (- Deduct)</option>
                  <option value="CORRECTION">Inventory Count Correction</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="Reason for adjustment"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 rounded-xl glow-btn text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isAdjusting ? 'Processing...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

