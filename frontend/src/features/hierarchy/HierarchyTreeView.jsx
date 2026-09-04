import React, { useState } from 'react';
import {
  useGetHierarchyTreeQuery,
  useGetDownlineQuery,
  useCreateChildUserMutation,
  useTransferChildMutation,
  useDeleteChildMutation,
} from '../../store/api/hierarchyApi';
import {
  ChevronRight,
  ChevronDown,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  X,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const HierarchyTreeView = () => {
  const { data: treeData = [], isLoading: isTreeLoading } = useGetHierarchyTreeQuery();
  const { data: downlineList = [], isLoading: isDownlineLoading } = useGetDownlineQuery();
  const [createChildApi, { isLoading: isCreating }] = useCreateChildUserMutation();
  const [transferChildApi, { isLoading: isTransferring }] = useTransferChildMutation();
  const [deleteChildApi] = useDeleteChildMutation();

  const [activeTab, setActiveTab] = useState('tree');
  const [expandedNodes, setExpandedNodes] = useState({});

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Form states
  const [childForm, setChildForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'BUSINESS',
  });
  const [transferParentId, setTransferParentId] = useState('');

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    try {
      await createChildApi(childForm).unwrap();
      toast.success('Child business created successfully');
      setShowCreateModal(false);
      setChildForm({ firstName: '', lastName: '', email: '', password: '', userType: 'BUSINESS' });
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to create child business');
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

  const handleDeleteChild = async (id, name) => {
    if (!window.confirm(`Are you sure you want to soft delete "${name}"?`)) return;
    try {
      await deleteChildApi(id).unwrap();
      toast.success('Node deleted');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Delete failed');
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

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-semibold">
              {node.childrenCount} Children
            </span>
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
                        onClick={() => {
                          setSelectedNodeId(item._id);
                          setShowTransferModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => handleDeleteChild(item._id, `${item.firstName} ${item.lastName}`)}
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
                <label className="text-slate-700 font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  required
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
