import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import {
  GitFork,
  ChevronRight,
  ChevronDown,
  UserPlus,
  ArrowRightLeft,
  Building,
  Shield,
  Search,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const HierarchyTreeView = () => {
  const [treeData, setTreeData] = useState([]);
  const [downlineList, setDownlineList] = useState([]);
  const [activeTab, setActiveTab] = useState('tree');
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    try {
      const [treeRes, downlineRes] = await Promise.all([
        api.get('/hierarchy/tree'),
        api.get('/hierarchy/downline'),
      ]);
      setTreeData(treeRes.data || []);
      const downlines = downlineRes.data || [];
      setDownlineList(downlines);
      if (downlines.length > 0) {
        setTransferParentId(downlines[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load business hierarchy tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleNode = (id) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateChild = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hierarchy/children', childForm);
      toast.success('Child business created successfully');
      setShowCreateModal(false);
      setChildForm({ firstName: '', lastName: '', email: '', password: '', userType: 'BUSINESS' });
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create child business');
    }
  };

  const handleTransferNode = async (e) => {
    e.preventDefault();
    if (!transferParentId) {
      toast.error('Please select a target new parent business');
      return;
    }
    try {
      await api.patch(`/hierarchy/transfer/${selectedNodeId}`, { newParentId: transferParentId });
      toast.success('Business node transferred');
      setShowTransferModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Transfer failed');
    }
  };

  const renderTreeNode = (node) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="ml-4 pl-4 border-l border-indigo-500/20 my-2">
        <div className="glass-card p-3.5 rounded-xl flex items-center justify-between gap-4 max-w-2xl">
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white transition"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-slate-600">•</div>
            )}

            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
              L{node.level}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100">{node.name}</h4>
              <p className="text-xs text-slate-400">{node.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              {node.childrenCount} Children
            </span>
            <button
              onClick={() => {
                setSelectedNodeId(node.id);
                setShowTransferModal(true);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1 cursor-pointer"
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
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Business Distribution Network</h2>
          <p className="text-xs text-slate-400">Manage multi-tier hierarchical parent-child relationships</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Child Business
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('tree')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'tree' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400'
          }`}
        >
          Hierarchy Tree View
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 transition relative cursor-pointer ${
            activeTab === 'list' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400'
          }`}
        >
          Downline List ({downlineList.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'tree' ? (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 min-h-[400px]">
          {treeData.map((rootNode) => renderTreeNode(rootNode))}
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Business Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Level</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {downlineList.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-slate-200">
                    {item.firstName} {item.lastName}
                  </td>
                  <td className="p-3 text-slate-400">{item.email}</td>
                  <td className="p-3">Level {item.hierarchyLevel}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedNodeId(item._id);
                        setShowTransferModal(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Transfer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Child Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">Create Downline Business</h3>

            <form onSubmit={handleCreateChild} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">First Name</label>
                <input
                  type="text"
                  required
                  value={childForm.firstName}
                  onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400">Last Name</label>
                <input
                  type="text"
                  required
                  value={childForm.lastName}
                  onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={childForm.email}
                  onChange={(e) => setChildForm({ ...childForm, email: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={childForm.password}
                  onChange={(e) => setChildForm({ ...childForm, password: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl glow-btn text-white font-semibold">
                  Create Business Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-md border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">Transfer Business Node</h3>
            <p className="text-xs text-slate-400">
              Re-parent this business and automatically update all downline materialized paths.
            </p>

            <form onSubmit={handleTransferNode} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Target New Parent Business</label>
                {downlineList.filter((b) => b._id !== selectedNodeId).length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                    No available downline target businesses to transfer to.
                  </div>
                ) : (
                  <select
                    required
                    value={transferParentId}
                    onChange={(e) => setTransferParentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {downlineList
                      .filter((b) => b._id !== selectedNodeId)
                      .map((parent) => (
                        <option key={parent._id} value={parent._id}>
                          {parent.firstName} {parent.lastName} ({parent.email}) - Level {parent.hierarchyLevel}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={downlineList.filter((b) => b._id !== selectedNodeId).length === 0}
                  className="px-4 py-2 rounded-xl glow-btn text-white font-semibold disabled:opacity-50"
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
