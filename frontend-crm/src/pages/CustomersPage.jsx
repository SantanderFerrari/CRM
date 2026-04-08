import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout          from '../components/layout/AppLayout';
import CustomerFormModal  from '../components/customers/CustomerFormModal';
import useCustomers       from '../hooks/useCustomers';
import { useAuth }        from '../context/AuthContext';

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const CustomersPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { customers, loading, error, search, setSearch, refresh } = useCustomers();
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = ['CUSTOMER_CARE', 'ADMIN'].includes(user?.role);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500">{customers.length} records</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="btn-primary w-auto px-5">
              + New customer
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Grid  to table*/}
        <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100 ml-auto" />
                </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="h-10 w-10 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            <p className="text-sm font-medium">No customers found</p>
            {search && <p className="text-xs mt-1">Try a different search term</p>}
          </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-xs text-gray-500">
                    <th className="px-6 py-3 text-left font-medium">Customer</th>
                    <th className="px-6 py-3 text-left font-medium">Phone</th>
                    <th className="px-6 py-3 text-left font-medium">Email</th>
                    <th className="px-6 py-3 text-left font-medium">Address</th>
                    <th className="px-6 py-3 text-left font-medium">KRA PIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((c) => (
                    <tr
                      key={c.customer_id}
                      onClick={() => navigate(`/customers/${c.customer_id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                      <td className="px-6 py-4 text-gray-600">{c.phone}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{c.email || '—'}</td>
                      <td className="px-6 py-4">{c.address || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{c.kra_pin || '—'}</td>
                      <td className="px-6 py-4">

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
        </div>
      </div>

      {showCreate && (
        <CustomerFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); refresh(); }}
        />
      )}
    </AppLayout>
  );
};

export default CustomersPage;