import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import { Boxes, Send, Clock, AlertTriangle, ArrowRightLeft, CheckCircle2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryView = () => {
  const [stockItems, setStockItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [downlineList, setDownlineList] = useState([]);
  const [activeTab, setActiveTab] = useState('stock');
  const [loading, setLoading] = useState(true);

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [childId, setChildId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  const loadInventory = async () => {
    try {
      const [stockRes, historyRes, downlineRes] = await Promise.all([
        api.get('/inventory/my-stock'),
        api.get('/inventory/history'),
        api.get('/hierarchy/downline'),
      ]);
      setStockItems(stockRes.data || []);
      setHistory(historyRes.data || []);
      const downlines = downlineRes.data || [];
      setDownlineList(downlines);
      if (downlines.length > 0) {
        setChildId(downlines[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load inventory stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAssignStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!childId) {
      toast.error('Please select a target downline business');
      return;
    }

    try {
      await api.post('/inventory/assign', {
        childId,
        productId: selectedProduct.productId?._id,
        quantity: Number(quantity),
        notes,
      });
      toast.success('Stock assigned successfully');
      setShowAssignModal(false);
      loadInventory();
    } catch (err) {
      toast.error(err.message || 'Stock assignment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Inventory & Distribution Ledger</h2>
          <p className="text-xs text-slate-400">Track owned stock balances and downline stock assignments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'stock' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400'
          }`}
        >
          My Available Stock
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400'
          }`}
        >
          Immutable Transaction History ({history.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stock' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stockItems.map((item) => (
            <div key={item._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{item.productId?.productName}</h3>
                  <span className="text-[10px] font-semibold text-slate-400">SKU: {item.productId?.sku}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-indigo-400 font-['Outfit']">{item.availableQty}</span>
                  <span className="text-[10px] block text-slate-500">Available Pcs</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Reserved: <span className="text-slate-200">{item.reservedQty}</span>
                </span>
                <button
                  onClick={() => {
                    setSelectedProduct(item);
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Assign Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">From Business</th>
                <th className="p-3">To Business</th>
                <th className="p-3">Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-200">{tx.productId?.productName}</td>
                  <td className="p-3 text-slate-400">{tx.fromOwnerId ? tx.fromOwnerId.email : 'System Root'}</td>
                  <td className="p-3 text-indigo-400">{tx.toOwnerId?.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px]">
                      {tx.transactionType}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-200">{tx.quantity}</td>
                  <td className="p-3 text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Stock Modal */}
      {showAssignModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">Assign Stock to Downline</h3>
            <p className="text-xs text-slate-400">
              Product: <span className="text-indigo-400 font-semibold">{selectedProduct.productId?.productName}</span> (Max Available: {selectedProduct.availableQty})
            </p>

            <form onSubmit={handleAssignStock} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Target Downline Business</label>
                {downlineList.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    No downline businesses found. Go to <strong>Business Hierarchy → Add Child Business</strong> to create one first.
                  </div>
                ) : (
                  <select
                    required
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {downlineList.map((child) => (
                      <option key={child._id} value={child._id}>
                        {child.firstName} {child.lastName} ({child.email}) - Level {child.hierarchyLevel}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Quantity to Transfer</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedProduct.availableQty}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="Optional reference note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 cursor-pointer"
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
    </div>
  );
};
