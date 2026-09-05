import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetHierarchyTreeQuery,
  useGetDownlineQuery,
  useCreateChildUserMutation,
  useUpdateChildUserMutation,
  useTransferChildMutation,
  useDeleteChildMutation,
} from '../../store/api/hierarchyApi';
import {
  ChevronRight,
  ChevronDown,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Edit2,
  X,
  Layers,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const HierarchyTreeView = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const { data: treeData = [], isLoading: isTreeLoading } = useGetHierarchyTreeQuery();
  const { data: downlineList = [], isLoading: isDownlineLoading } = useGetDownlineQuery();
  const [createChildApi, { isLoading: isCreating }] = useCreateChildUserMutation();
  const [updateChildApi, { isLoading: isUpdating }] = useUpdateChildUserMutation();
  const [transferChildApi, { isLoading: isTransferring }] = useTransferChildMutation();
  const [deleteChildApi] = useDeleteChildMutation();

  const [activeTab, setActiveTab] = useState('tree');
  const [expandedNodes, setExpandedNodes] = useState({});

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Form states
  const [childForm, setChildForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'BUSINESS',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    level: 0,
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    status: 'ACTIVE',
  });


  const [transferParentId, setTransferParentId] = useState('');

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    if (!childForm.password || childForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await createChildApi(childForm).unwrap();
      toast.success('Child business created successfully');
      setShowCreateModal(false);
      setChildForm({ firstName: '', lastName: '', email: '', password: '', userType: 'BUSINESS' });
    } catch (err) {
      const errorMsg =
        err?.data?.errors?.length > 0
          ? err.data.errors.join(', ')
          : err?.data?.message || err?.message || 'Failed to create child business';
      toast.error(errorMsg);
    }
  };

  const handleOpenEdit = (item) => {
    setEditForm({
      id: item._id || item.id,
      level: item.level !== undefined ? item.level : item.hierarchyLevel,
      userType: item.userType,
      firstName: item.firstName || item.name?.split(' ')[0] || '',
      lastName: item.lastName || item.name?.split(' ').slice(1).join(' ') || '',
      phone: item.phone || '',
      address: item.address || '',
      city: item.city || '',
      status: item.status || 'ACTIVE',
    });
    setShowEditModal(true);
  };


  const handleUpdateChild = async (e) => {
    e.preventDefault();
    try {
      await updateChildApi(editForm).unwrap();
      toast.success('Business node details updated successfully');
      setShowEditModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to update business node');
    }
  };

  const handleTransferNode = async (e) => {
    e.preventDefault();
    const targetParent = transferParentId || downlineList.filter((b) => b._id !== selectedNodeId)[0]?._id;
    if (!targetParent) {
      toast.error('Please select a target new parent business');
      return;
    }
    try {
      await transferChildApi({ id: selectedNodeId, newParentId: targetParent }).unwrap();
      toast.success('Business node transferred');
      setShowTransferModal(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Transfer failed');
    }
  };

  const handleDeleteChild = async (target) => {
    try {
      await deleteChildApi(target.id).unwrap();
      toast.success(`Node "${target.name}" deleted successfully`);
      setDeleteConfirmTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Delete failed', { duration: 5000 });
    }
  };

  const renderTreeNode = (node) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4 pl-4 border-l-2 border-indigo-200 my-2.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 max-w-2xl hover:border-indigo-200 transition">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center text-slate-300 font-bold">•</div>
            )}

            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-2xs">
              L{node.level}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900">{node.name}</h4>
              <p className="text-xs text-slate-500 font-medium">{node.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold">
              {node.childrenCount} Children
            </span>
            <button
              onClick={() => handleOpenEdit(node)}
              title="Edit Node"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedNodeId(node.id);
                setShowTransferModal(true);
              }}
              title="Transfer Node"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
            {node.level > 0 && (
              <button
                onClick={() => setDeleteConfirmTarget({ id: node.id, name: node.name })}
                title="Delete Node"
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">{node.children.map((child) => renderTreeNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Business Distribution Network</h2>
          <p className="text-xs text-slate-500 font-medium">Manage multi-tier hierarchical parent-child relationships</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Child Business
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('tree')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'tree' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Hierarchy Tree View
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Downline List ({downlineList.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'tree' ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
          {treeData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-medium">
              No hierarchy nodes found.
            </div>
          ) : (
            treeData.map((rootNode) => renderTreeNode(rootNode))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Business Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Level</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {downlineList.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-semibold text-slate-900">
                      {item.firstName} {item.lastName}
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">{item.email}</td>
                    <td className="p-3.5 font-semibold text-slate-700">Level {item.hierarchyLevel}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNodeId(item._id);
                          setShowTransferModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => setDeleteConfirmTarget({ id: item._id, name: `${item.firstName} ${item.lastName}` })}
                        className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Delete Business Node</h4>
                <p className="text-xs text-slate-500">Confirm hierarchy removal & revocation</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deleteConfirmTarget.name}</strong>?
              If this business node has child branches, assigned staff, or active inventory balances, deletion will be blocked to protect relational integrity.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChild(deleteConfirmTarget)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Node Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Edit Business Node</h3>
                <p className="text-xs text-slate-500">Update node contact & profile information</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateChild} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">City / Region</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Account Status</label>
                {editForm.id === currentUser?._id || editForm.level === 0 || editForm.userType === 'SUPER_ADMIN' ? (
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium text-xs flex items-center justify-between">
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      ACTIVE (Protected)
                    </span>
                    <span className="text-[10px] text-slate-400">Root / Own account cannot be blocked</span>
                  </div>
                ) : (
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 transition font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                )}
              </div>


              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl glow-btn text-white font-semibold cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Child Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Create Downline Business</h3>
                <p className="text-xs text-slate-500">Register a new child node in your distribution hierarchy</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={childForm.firstName}
                  onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={childForm.lastName}
                  onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={childForm.email}
                  onChange={(e) => setChildForm({ ...childForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Password <span className="text-slate-400 text-[10px] font-normal">(min 6 characters)</span></label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  value={childForm.password}
                  onChange={(e) => setChildForm({ ...childForm, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                />
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
                  Create Business Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Transfer Business Node</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Re-parent this business and automatically update all downline materialized paths.
                </p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferNode} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1.5">Target New Parent Business</label>
                {downlineList.filter((b) => b._id !== selectedNodeId).length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    No available downline target businesses to transfer to.
                  </div>
                ) : (
                  <select
                    required
                    value={transferParentId}
                    onChange={(e) => setTransferParentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  >
                    {downlineList
                      .filter((b) => b._id !== selectedNodeId)
                      .map((parent) => (
                        <option key={parent._id} value={parent._id} className="bg-white text-slate-900">
                          {parent.firstName} {parent.lastName} ({parent.email}) - Level {parent.hierarchyLevel}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={downlineList.filter((b) => b._id !== selectedNodeId).length === 0}
                  className="px-5 py-2 rounded-xl glow-btn text-white font-semibold disabled:opacity-50 cursor-pointer"
                >
                  Confirm Node Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

