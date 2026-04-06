import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout      from '../../components/layout/AppLayout';
import UserFormModal  from '../../components/users/UserFormModal';
import { useAuth }    from '../../context/AuthContext';
import { getUsers, activateUser, deactivateUser } from '../../api/users.api';

const ROLES = ['', 'CUSTOMER_CARE','TECHNICIAN','SUPERVISOR',
               'SALES_REPRESENTATIVE','HEAD_OF_DEPARTMENT','HUMAN_RESOURCES','ADMIN'];

const ROLE_COLORS = {
  ADMIN:               'bg-purple-100 text-purple-700',
  SUPERVISOR:          'bg-blue-100   text-blue-700',
  TECHNICIAN:          'bg-green-100  text-green-700',
  CUSTOMER_CARE:       'bg-yellow-100 text-yellow-700',
  SALES_REPRESENTATIVE:'bg-orange-100 text-orange-700',
  HEAD_OF_DEPARTMENT:  'bg-red-100    text-red-700',
  HUMAN_RESOURCES:     'bg-pink-100   text-pink-700',
};

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const UsersPage = () => {
  const { user: me } = useAuth();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [toggling,   setToggling]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.is_active = activeFilter;
      const { data } = await getUsers(params);
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, activeFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleToggleActive = async (u) => {
    setToggling(u.user_id);
    try {
      if (u.is_active) {
        await deactivateUser(u.user_id);
        toast.success(`${u.name} deactivated.`);
      } else {
        await activateUser(u.user_id);
        toast.success(`${u.name} activated.`);
      }
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">{users.length} users</p>
          </div>
          {me?.role === 'ADMIN' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary w-auto px-5">
              + New user
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto" value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r || 'All roles'}</option>
            ))}
          </select>
          <select className="input w-auto" value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(roleFilter || activeFilter) && (
            <button onClick={() => { setRoleFilter(''); setActiveFilter(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline">
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-9 w-9 rounded-full animate-pulse bg-gray-100" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 rounded animate-pulse bg-gray-100" />
                    <div className="h-3 w-48 rounded animate-pulse bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-xs text-gray-500">
                    <th className="px-6 py-3 text-left font-medium">User</th>
                    <th className="px-6 py-3 text-left font-medium">Role</th>
                    <th className="px-6 py-3 text-left font-medium">Phone</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Joined</th>
                    {me?.role === 'ADMIN' && (
                      <th className="px-6 py-3 text-left font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center
                                          rounded-full text-xs font-semibold
                                          ${u.is_active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-400'}`}>
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      {me?.role === 'ADMIN' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {u.user_id !== me.user_id && (
                              <>
                                <button onClick={() => setEditUser(u)}
                                  className="text-xs text-brand-600 hover:underline">
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  disabled={toggling === u.user_id}
                                  className={`text-xs hover:underline ${u.is_active ? 'text-red-500' : 'text-green-600'}`}
                                >
                                  {toggling === u.user_id ? '...' : u.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                              </>
                            )}
                            {u.user_id === me.user_id && (
                              <span className="text-xs text-gray-300">You</span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {showCreate && (
        <UserFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetch(); }}
        />
      )}

      {editUser && (
        <UserFormModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetch(); }}
        />
      )}
    </AppLayout>
  );
};

export default UsersPage;