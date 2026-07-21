import React, { useEffect, useState } from 'react';
import { api } from '../../config/axios';
import { ShieldCheck, Plus, Copy, UserCheck, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export const RolesView = () => {
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [description, setDescription] = useState('');

  const MODULES = ['products', 'inventory', 'orders', 'users', 'reports', 'revenue', 'roles'];
  const ACTIONS = ['view', 'create', 'update', 'delete', 'approve', 'export'];

  const [permissions, setPermissions] = useState(() => {
    const initial = {};
    MODULES.forEach((m) => {
      initial[m] = { view: false, create: false, update: false, delete: false, approve: false, export: false };
    });
    return initial;
  });

  const loadRoles = async () => {
    try {
      const [rolesRes, statsRes] = await Promise.all([api.get('/roles'), api.get('/roles/stats')]);
      setRoles(rolesRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load dynamic business roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleTogglePermission = (module, action) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/roles', {
        roleName: newRoleName,
        description,
        permissions,
      });
      toast.success('Dynamic role created successfully');
      setShowCreateModal(false);
      setNewRoleName('');
      setDescription('');
      loadRoles();
    } catch (err) {
      toast.error(err.message || 'Failed to create role');
    }
  };

  const handleCloneRole = async (roleId, roleName) => {
    const clonedName = prompt(`Enter new cloned name for ${roleName}:`, `${roleName} Copy`);
    if (!clonedName) return;

    try {
      await api.post(`/roles/${roleId}/clone`, { newRoleName: clonedName });
      toast.success('Role cloned successfully');
      loadRoles();
    } catch (err) {
      toast.error(err.message || 'Clone failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Dynamic Business Roles</h2>
          <p className="text-xs text-slate-400">Scoped branch roles with fine-grained modular permission matrices</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Branch Role
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">{role.roleName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{role.description || 'Custom Branch Role'}</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                {role.status}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Assigned Staff: {role.assignedUsersCount ?? 0}</span>
              <button
                onClick={() => handleCloneRole(role._id, role.roleName)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Clone
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Modal with Permission Matrix */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-slate-800 space-y-6">
            <h3 className="text-xl font-bold text-white font-['Outfit']">Create Dynamic Branch Role</h3>

            <form onSubmit={handleCreateRole} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse Head, Senior Sales"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Description</label>
                  <input
                    type="text"
                    placeholder="Brief scope of responsibilities"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              {/* Matrix Table */}
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-3">Module Permission Matrix</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Module</th>
                        {ACTIONS.map((act) => (
                          <th key={act} className="p-3 text-center uppercase">
                            {act}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {MODULES.map((mod) => (
                        <tr key={mod} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold uppercase text-slate-200">{mod}</td>
                          {ACTIONS.map((act) => (
                            <td key={act} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={permissions[mod]?.[act] || false}
                                onChange={() => handleTogglePermission(mod, act)}
                                className="w-4 h-4 accent-indigo-600 cursor-pointer rounded"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl glow-btn text-white font-semibold">
                  Save Role Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
