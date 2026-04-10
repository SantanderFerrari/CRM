import { useState } from 'react';
import { useNavigate }    from 'react-router-dom';
import AppLayout          from '../../components/layout/AppLayout';
import DeviceFormModal    from '../../components/devices/DeviceFormModal';
import useDevices         from '../../hooks/useDevices';
import { useAuth }        from '../../context/AuthContext';
import { getCustomers }   from '../../api/customers.api';

const DEVICE_TYPES = ['Smartphone', 'Laptop', 'Tablet', 'Desktop', 'Printer', 'TV', 'Other'];

// Device type icon — simple SVG paths per type
const DeviceIcon = ({ type }) => {
  const paths = {
    Smartphone: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    Laptop:     'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    Tablet:     'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    Desktop:    'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    Printer:    'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
    TV:         'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    Other:      'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  };
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={paths[type] || paths.Other} />
    </svg>
  );
};

const TYPE_COLORS = {
  Smartphone: 'bg-blue-50   text-blue-600',
  Laptop:     'bg-purple-50 text-purple-600',
  Tablet:     'bg-teal-50   text-teal-600',
  Desktop:    'bg-indigo-50 text-indigo-600',
  Printer:    'bg-orange-50 text-orange-600',
  TV:         'bg-pink-50   text-pink-600',
  Other:      'bg-gray-50   text-gray-500',
};

const DevicesPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const {
    devices, loading, error,
    search, setSearch,
    typeFilter, setTypeFilter,
    refresh,
  } = useDevices();

  const [showRegister,    setShowRegister]    = useState(false);
  const [editDevice,      setEditDevice]      = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch,  setCustomerSearch]  = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [viewMode,        setViewMode]        = useState('table'); // 'table' | 'grid'

  const canRegister = ['CUSTOMER_CARE', 'ADMIN'].includes(user?.role);

  // Search customers for the register flow
  const handleCustomerSearch = async (q) => {
    setCustomerSearch(q);
    if (!q.trim()) { setCustomerResults([]); return; }
    setCustomerLoading(true);
    try {
      const { data } = await getCustomers({ search: q, limit: 8 });
      setCustomerResults(data.customers);
    } catch { /* ignore */ }
    finally { setCustomerLoading(false); }
  };

  const openRegister = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerResults([]);
    setShowRegister(true);
  };

  // Summary stats
  const typeCounts = devices.reduce((acc, d) => {
    const t = d.device_type || 'Other';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Devices</h1>
            <p className="text-sm text-gray-500">{devices.length} devices</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs transition ${viewMode === 'table' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs transition ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Grid
              </button>
            </div>
            {canRegister && (
              <button onClick={openRegister} className="btn-primary w-auto px-5">
                + Register device
              </button>
            )}
          </div>
        </div>

        {/* Type summary pills */}
        {!loading && Object.keys(typeCounts).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('')}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition
                ${!typeFilter ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              All ({devices.length})
            </button>
            {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition
                  ${typeFilter === type ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              >
                {type} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Search brand, model, serial, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── TABLE VIEW ─────────────────────────────────────────────────── */}
        {viewMode === 'table' && (
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-100">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="h-10 w-10 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">No devices found</p>
                {(search || typeFilter) && (
                  <button onClick={() => { setSearch(''); setTypeFilter(''); }}
                    className="mt-2 text-xs text-brand-600 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr className="text-xs text-gray-500">
                      <th className="px-6 py-3 text-left font-medium">Device</th>
                      <th className="px-6 py-3 text-left font-medium">Type</th>
                      <th className="px-6 py-3 text-left font-medium">Serial number</th>
                      <th className="px-6 py-3 text-left font-medium">Customer</th>
                      <th className="px-6 py-3 text-left font-medium">Registered</th>
                      {canRegister && <th className="px-6 py-3 text-left font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {devices.map((d) => (
                      <tr key={d.device_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center
                                            rounded-xl ${TYPE_COLORS[d.device_type] || TYPE_COLORS.Other}`}>
                              <DeviceIcon type={d.device_type} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {d.brand || '—'} {d.model || ''}
                              </p>
                              {!d.brand && !d.model && (
                                <p className="text-xs text-gray-400">No brand/model</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${TYPE_COLORS[d.device_type] || TYPE_COLORS.Other}`}>
                            {d.device_type || 'Other'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-600">
                            {d.serial_number || <span className="text-gray-300 font-sans">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/customers/${d.customer_id}`)}
                            className="text-sm text-brand-600 hover:underline"
                          >
                            {d.customer_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        {canRegister && (
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setEditDevice(d)}
                              className="text-xs text-brand-600 hover:underline"
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── GRID VIEW ──────────────────────────────────────────────────── */}
        {viewMode === 'grid' && (
          loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-200" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 rounded bg-gray-200" />
                      <div className="h-3 w-20 rounded bg-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-gray-400">
              <p className="text-sm font-medium">No devices found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devices.map((d) => (
                <div key={d.device_id} className="card hover:shadow-md hover:border-gray-300 transition-all duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center
                                      rounded-xl ${TYPE_COLORS[d.device_type] || TYPE_COLORS.Other}`}>
                        <DeviceIcon type={d.device_type} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {d.brand || '—'} {d.model || ''}
                        </p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mt-0.5
                          ${TYPE_COLORS[d.device_type] || TYPE_COLORS.Other}`}>
                          {d.device_type || 'Other'}
                        </span>
                      </div>
                    </div>
                    {canRegister && (
                      <button onClick={() => setEditDevice(d)}
                        className="flex-shrink-0 text-xs text-gray-400 hover:text-brand-600">
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Serial</span>
                      <span className="font-mono text-gray-700">
                        {d.serial_number || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Customer</span>
                      <button
                        onClick={() => navigate(`/customers/${d.customer_id}`)}
                        className="text-brand-600 hover:underline font-medium truncate max-w-[140px]"
                      >
                        {d.customer_name}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Registered</span>
                      <span className="text-gray-500">{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      {/* ── Register device — customer picker first ─────────────────────── */}
      {showRegister && !selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Select customer</h2>
              <button onClick={() => setShowRegister(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              <input
                className="input"
                placeholder="Search customer by name, phone or email..."
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {customerLoading && (
                  <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
                )}
                {!customerLoading && customerSearch && customerResults.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-400">No customers found.</div>
                )}
                {!customerLoading && !customerSearch && (
                  <div className="p-4 text-center text-sm text-gray-400">Type to search customers...</div>
                )}
                {customerResults.map((c) => (
                  <button
                    key={c.customer_id}
                    onClick={() => setSelectedCustomer(c)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone || c.email || '—'}</p>
                    </div>
                    <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4">
              <button onClick={() => setShowRegister(false)} className="btn-secondary w-auto px-5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register device form — after customer selected */}
      {showRegister && selectedCustomer && (
        <DeviceFormModal
          customerId={selectedCustomer.customer_id}
          customerName={selectedCustomer.name}
          onClose={() => { setShowRegister(false); setSelectedCustomer(null); }}
          onSaved={() => { setShowRegister(false); setSelectedCustomer(null); refresh(); }}
        />
      )}

      {/* Edit device */}
      {editDevice && (
        <DeviceFormModal
          device={editDevice}
          customerId={editDevice.customer_id}
          customerName={editDevice.customer_name}
          onClose={() => setEditDevice(null)}
          onSaved={() => { setEditDevice(null); refresh(); }}
        />
      )}
    </AppLayout>
  );
};

export default DevicesPage;