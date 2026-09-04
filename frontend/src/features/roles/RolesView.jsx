import React, { useState } from 'react';
import {
  useGetRolesQuery,
  useGetRoleStatsQuery,
  useCreateRoleMutation,
  useCloneRoleMutation,
  useDeleteRoleMutation,
  useAssignRoleMutation,
} from '../../store/api/rolesApi';
import { Plus, Copy, X, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const RolesView = () => {
  const { data: roles = [], isLoading: isRolesLoading } = useGetRolesQuery();
  const { data: stats } = useGetRoleStatsQuery();
  const [createRoleApi, { isLoading: isCreating }] = useCreateRoleMutation();
  const [cloneRoleApi] = useCloneRoleMutation();
  const [deleteRoleApi] = useDeleteRoleMutation();
  const [assignRoleApi] = useAssignRoleMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);
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
      await createRoleApi({
        roleName: newRoleName,
        description,
        permissions,
      }).unwrap();
      toast.success('Dynamic role created successfully');
      setShowCreateModal(false);
      setNewRoleName('');
      setDescription('');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to create role');
    }
  };

  const handleCloneRole = async (roleId, roleName) => {
    const clonedName = prompt(`Enter new cloned name for ${roleName}:`, `${roleName} Copy`);
    if (!clonedName) return;

    try {
      await cloneRoleApi({ id: roleId, newRoleName: clonedName }).unwrap();
      toast.success('Role cloned successfully');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Clone failed');
    }
  };

  const handleDeleteRole = async (role) => {
    try {
      await deleteRoleApi(role._id).unwrap();
      toast.success(`Role "${role.roleName}" deleted successfully`);
      setDeleteConfirmTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete role', { duration: 5000 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-['Outfit']">Dynamic Business Roles</h2>
          <p className="text-xs text-slate-500 font-medium">Scoped branch roles with fine-grained modular permission matrices</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl glow-btn text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Branch Role
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {roles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200">
            No dynamic roles configured.
          </div>
        ) : (
          roles.map((role) => (
            <div key={role._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{role.roleName}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{role.description || 'Custom Branch Role'}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-semibold">
                  {role.status}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Assigned Staff: <strong className="text-slate-800 font-semibold">{role.assignedUsersCount ?? 0}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCloneRole(role._id, role.roleName)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Clone role"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Clone
                  </button>
                  <button
                    onClick={() => setDeleteConfirmTarget(role)}
                    className="text-slate-400 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer transition p-1 hover:bg-rose-50 rounded-lg"
                    title="Delete role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Role Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 font-['Outfit']">Delete Dynamic Role</h4>
                <p className="text-xs text-slate-500">Confirm role removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete role <strong className="text-slate-900">{deleteConfirmTarget.roleName}</strong>?
              If any staff member is currently assigned to this role, deletion will be blocked until their role is reassigned.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRole(deleteConfirmTarget)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal with Permission Matrix */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white p-6 sm:p-8 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-6 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-['Outfit']">Create Dynamic Branch Role</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Configure access policies and module capabilities</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse Head, Senior Sales"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Brief scope of responsibilities"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium"
                  />
                </div>
              </div>

              {/* Matrix Table */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Module Permission Matrix</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Module</th>
                        {ACTIONS.map((act) => (
                          <th key={act} className="p-3.5 text-center uppercase">
                            {act}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MODULES.map((mod) => (
                        <tr key={mod} className="hover:bg-slate-50/60 transition">
                          <td className="p-3.5 font-bold uppercase text-slate-900">{mod}</td>
                          {ACTIONS.map((act) => (
                            <td key={act} className="p-3.5 text-center">
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl glow-btn text-white font-semibold cursor-pointer">
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

