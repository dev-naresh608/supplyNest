import React, { useState } from 'react';
import {
  useGetMyStockQuery,
  useGetNetworkStockQuery,
  useGetTransactionHistoryQuery,
  useGetAdjustmentRequestsQuery,
  useReviewAdjustmentRequestMutation,
  useAssignStockMutation,
  useAdjustStockMutation,
} from '../../store/api/inventoryApi';
import { useGetDownlineQuery } from '../../store/api/hierarchyApi';
import { useSelector } from 'react-redux';
import {
  Send,
  Sliders,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertTriangle,
  Layers,
  History,
  ShieldAlert,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const InventoryView = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN';

  const { data: stockItems = [], isLoading: isStockLoading } = useGetMyStockQuery();
  const { data: networkStock = [], isLoading: isNetworkStockLoading } = useGetNetworkStockQuery(
    undefined,
    { skip: !isSuperAdmin }
  );
  const { data: history = [], isLoading: isHistoryLoading } = useGetTransactionHistoryQuery();
  const { data: adjustmentRequests = [], isLoading: isRequestsLoading } = useGetAdjustmentRequestsQuery();
  const { data: downlineList = [] } = useGetDownlineQuery();

  const [assignStockApi, { isLoading: isAssigning }] = useAssignStockMutation();
  const [adjustStockApi, { isLoading: isAdjusting }] = useAdjustStockMutation();
  const [reviewRequestApi, { isLoading: isReviewing }] = useReviewAdjustmentRequestMutation();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'network' | 'requests' | 'history'
  const [networkSearch, setNetworkSearch] = useState('');

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [childId, setChildId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState(isSuperAdmin ? 'STOCK_IN' : 'DAMAGE');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Review Modal State
  const [selectedRequestToReview, setSelectedRequestToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [reviewNotes, setReviewNotes] = useState('');

  const pendingRequestsCount = adjustmentRequests.filter((r) => r.status === 'PENDING').length;

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
      const errorMsg =
        err?.data?.errors?.length > 0
          ? err.data.errors.join(', ')
          : err?.data?.message || err?.message || 'Stock assignment failed';
      toast.error(errorMsg);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustProduct) return;

    try {
      const res = await adjustStockApi({
        productId: adjustProduct.productId?._id,
        quantity: Number(adjustQty),
        type: adjustType,
        notes: adjustNotes,
      }).unwrap();

      if (res?.data?.isPendingApproval || res?.isPendingApproval) {
        toast.success('Stock adjustment request submitted for Super Admin authorization', {
          icon: '⏳',
          duration: 5000,
        });
      } else {
        toast.success('Stock adjusted successfully');
      }

      setShowAdjustModal(false);
      setAdjustNotes('');
    } catch (err) {
      const errorMsg =
        err?.data?.errors?.length > 0
          ? err.data.errors.join(', ')
          : err?.data?.message || err?.message || 'Stock adjustment failed';
      toast.error(errorMsg);
    }
  };

  const handleExecuteReview = async (e) => {
    e.preventDefault();
    if (!selectedRequestToReview) return;

    try {
      await reviewRequestApi({
        id: selectedRequestToReview._id,
        action: reviewAction,
        reviewNotes,
      }).unwrap();

      toast.success(
        reviewAction === 'APPROVE'
          ? 'Stock adjustment approved and applied to inventory'
          : 'Stock adjustment request rejected'
      );
      setSelectedRequestToReview(null);
      setReviewNotes('');
    } catch (err) {
      const errorMsg =
        err?.data?.errors?.length > 0
          ? err.data.errors.join(', ')
          : err?.data?.message || err?.message || 'Failed to review request';
      toast.error(errorMsg);
    }
  };

  const filteredNetworkStock = networkStock.filter((inv) => {
    if (!networkSearch.trim()) return true;
    const term = networkSearch.toLowerCase();
    const ownerName = `${inv.ownerId?.firstName || ''} ${inv.ownerId?.lastName || ''}`.toLowerCase();
    const ownerEmail = (inv.ownerId?.email || '').toLowerCase();
    const prodName = (inv.productId?.productName || '').toLowerCase();
    const sku = (inv.productId?.sku || '').toLowerCase();
    return (
      ownerName.includes(term) ||
      ownerEmail.includes(term) ||
      prodName.includes(term) ||
      sku.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Inventory & Distribution Ledger</h2>
          <p className="text-xs text-slate-500 font-medium">
            {isSuperAdmin
              ? 'Complete enterprise stock governance, downline visibility, and adjustment approvals'
              : 'Track owned stock balances, assign downline stock, and submit adjustment requests'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 transition relative whitespace-nowrap cursor-pointer ${
            activeTab === 'stock'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isSuperAdmin ? 'Master Root Stock' : 'My Available Stock'}
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('network')}
            className={`pb-3 transition relative whitespace-nowrap cursor-pointer ${
              activeTab === 'network'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Downline Network Stock ({networkStock.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 transition relative whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isSuperAdmin ? 'Adjustment Approvals' : 'My Adjustment Requests'}
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition relative whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isSuperAdmin ? `Global Network Ledger (${history.length})` : `My Transaction History (${history.length})`}
        </button>
      </div>

      {/* TAB 1: My Stock */}
      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stockItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
              No inventory stock items found.
            </div>
          ) : (
            stockItems.map((item) => (
              <div
                key={item._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-4"
              >
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

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Reserved</span>
                    <span className="font-semibold text-slate-700">{item.reservedQty || 0} Pcs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Damaged</span>
                    <span className="font-semibold text-rose-600">{item.damagedQty || 0} Pcs</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Selling Price: <strong className="text-emerald-700">₹{item.productId?.sellingPrice || 0}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAdjustProduct(item);
                        setAdjustType(isSuperAdmin ? 'STOCK_IN' : 'DAMAGE');
                        setAdjustQty(1);
                        setShowAdjustModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {isSuperAdmin ? 'Adjust' : 'Request Adjust'}
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
      )}

      {/* TAB 2: Downline Network Stock (Super Admin Only) */}
      {activeTab === 'network' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by business name, email, product or SKU..."
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredNetworkStock.length} node stock allocations
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Business / Node</th>
                    <th className="p-3.5">Hierarchy Level</th>
                    <th className="p-3.5">Product & SKU</th>
                    <th className="p-3.5">Available Stock</th>
                    <th className="p-3.5">Reserved</th>
                    <th className="p-3.5">Damaged</th>
                    <th className="p-3.5 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNetworkStock.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">
                        No downline stock allocations found.
                      </td>
                    </tr>
                  ) : (
                    filteredNetworkStock.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-semibold text-slate-900">
                          <div>
                            {inv.ownerId?.firstName} {inv.ownerId?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">{inv.ownerId?.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold text-[10px]">
                            Level {inv.ownerId?.hierarchyLevel || 0}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{inv.productId?.productName}</div>
                          <div className="text-[10px] text-indigo-600 font-bold">{inv.productId?.sku}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-indigo-700 text-sm">{inv.availableQty} Pcs</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-600">{inv.reservedQty || 0} Pcs</td>
                        <td className="p-3.5">
                          {inv.damagedQty > 0 ? (
                            <span className="text-rose-600 font-bold">{inv.damagedQty} Pcs</span>
                          ) : (
                            <span className="text-slate-400">0 Pcs</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right text-slate-500 font-medium">
                          {new Date(inv.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Adjustment Approvals / My Adjustment Requests */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Requester Business</th>
                  <th className="p-3.5">Product & SKU</th>
                  <th className="p-3.5">Adjustment Type</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Reason / Justification</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  {isSuperAdmin && <th className="p-3.5 text-right">Review Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustmentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 8 : 7} className="p-8 text-center text-slate-400 font-medium">
                      No stock adjustment requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  adjustmentRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-semibold text-slate-900">
                        <div>
                          {req.requesterId?.firstName} {req.requesterId?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">{req.requesterId?.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{req.productId?.productName}</div>
                        <div className="text-[10px] text-indigo-600 font-bold">{req.productId?.sku}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                          {req.type}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{req.quantity} Pcs</td>
                      <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate">
                        {req.reason || 'No reason provided'}
                        {req.reviewNotes && (
                          <div className="text-[10px] text-indigo-600 font-normal">
                            Note: {req.reviewNotes}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending Approval
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      {isSuperAdmin && (
                        <td className="p-3.5 text-right space-x-2">
                          {req.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequestToReview(req);
                                  setReviewAction('APPROVE');
                                  setReviewNotes('');
                                }}
                                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequestToReview(req);
                                  setReviewAction('REJECT');
                                  setReviewNotes('');
                                }}
                                className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Reviewed by {req.reviewedBy?.firstName || 'Admin'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Transaction History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">From Business</th>
                  <th className="p-3.5">To Business</th>
                  <th className="p-3.5">Transaction Type</th>
                  <th className="p-3.5">Quantity</th>
                  <th className="p-3.5">Authorized By</th>
                  <th className="p-3.5">Notes</th>
                  <th className="p-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                      No stock transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-semibold text-slate-900">{tx.productId?.productName}</td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {tx.fromOwnerId ? `${tx.fromOwnerId.email}` : 'System Root'}
                      </td>
                      <td className="p-3.5 text-indigo-600 font-medium">{tx.toOwnerId?.email || '-'}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-semibold">
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">{tx.quantity} Pcs</td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {tx.performedBy?.firstName || tx.performedBy?.email || 'System'}
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium max-w-xs truncate">{tx.notes || '-'}</td>
                      <td className="p-3.5 text-right text-slate-500 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Assign Stock to Downline */}
      {showAssignModal && selectedProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Assign Stock to Downline</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Product: <span className="text-indigo-600 font-semibold">{selectedProduct.productId?.productName}</span> (Available: {selectedProduct.availableQty})
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
                    No downline businesses found. Create a child business node in <strong>Business Hierarchy</strong> first.
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
                  disabled={downlineList.length === 0 || isAssigning}
                  className="px-5 py-2 rounded-xl glow-btn text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isAssigning ? 'Transferring...' : 'Execute Stock Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Adjust Stock / Request Adjustment */}
      {showAdjustModal && adjustProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  {isSuperAdmin ? 'Direct Stock Adjustment' : 'Request Stock Adjustment'}
                </h3>
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

            {!isSuperAdmin && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Downline business stock adjustments require <strong>Super Admin approval</strong>. Once submitted, your request will appear under <em>My Adjustment Requests</em> and stock balances will update upon authorization.
                </p>
              </div>
            )}

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                >
                  {isSuperAdmin && <option value="STOCK_IN">Stock In (Master Receive)</option>}
                  <option value="DAMAGE">Mark Damaged (- Deduct)</option>
                  <option value="RETURN">Return Stock to Parent (- Deduct)</option>
                  <option value="CORRECTION">Inventory Count Correction</option>
                  <option value="ADJUSTMENT">Stock Adjustment</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={
                    adjustType === 'DAMAGE' || adjustType === 'RETURN'
                      ? adjustProduct.availableQty
                      : undefined
                  }
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Reason / Justification {!isSuperAdmin && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  required={!isSuperAdmin}
                  rows={2}
                  placeholder={
                    isSuperAdmin
                      ? 'Optional administrative adjustment note'
                      : 'Provide clear justification for Super Admin review (e.g. 2 units found damaged in transit)'
                  }
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
                  {isAdjusting
                    ? 'Submitting...'
                    : isSuperAdmin
                    ? 'Apply Adjustment'
                    : 'Submit for Super Admin Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Super Admin Review & Approval */}
      {selectedRequestToReview && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  {reviewAction === 'APPROVE' ? 'Authorize Stock Adjustment' : 'Reject Stock Adjustment'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Reviewing request from <strong className="text-slate-800">{selectedRequestToReview.requesterId?.email}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestToReview(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <strong className="text-slate-900">{selectedRequestToReview.productId?.productName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Adjustment Type:</span>
                <span className="font-bold text-indigo-700">{selectedRequestToReview.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Quantity:</span>
                <strong className="text-slate-900">{selectedRequestToReview.quantity} Pcs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requester Reason:</span>
                <span className="text-slate-700 font-medium">{selectedRequestToReview.reason || '-'}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteReview} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  {reviewAction === 'APPROVE' ? 'Approval Note (Optional)' : 'Rejection Reason'}
                </label>
                <input
                  type="text"
                  required={reviewAction === 'REJECT'}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'Optional note for ledger logs'
                      : 'Provide reason for rejecting this adjustment request'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequestToReview(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewing}
                  className={`px-5 py-2 rounded-xl font-semibold text-white cursor-pointer transition shadow-sm ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isReviewing
                    ? 'Processing...'
                    : reviewAction === 'APPROVE'
                    ? 'Confirm & Apply Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
