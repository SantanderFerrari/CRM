import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppLayout         from '../components/layout/AppLayout';
import StatusBadge       from '../components/common/StatusBadge';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import DeviceFormModal   from '../components/devices/DeviceFormModal';
import useCustomer       from '../hooks/useCustomer';
import { useAuth }       from '../context/AuthContext';
import { deleteCustomer } from '../api/customers.api';

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
};

const CustomerDetailPage = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const { customer, devices, tickets, loading, error, refresh } = useCustomer(id);

  const [showEdit,      setShowEdit]      = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editDevice,    setEditDevice]    = useState(null);
  const [activeTab,     setActiveTab]     = useState('devices');
  const [deleting,      setDeleting]      = useState(false);

  const canEdit   = ['CUSTOMER_CARE', 'ADMIN'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

  const handleDelete = async () => {
    if (!window.confirm(`Delete customer "${customer?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted.');
      navigate('/customers', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    </AppLayout>
  );

  if (error || !customer) return (
    <AppLayout>
      <div className="p-8 text-center text-sm text-red-500">{error || 'Customer not found.'}</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-4xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/customers')} className="hover:text-gray-600">Customers</button>
          <span>/</span>
          <span className="text-gray-600 font-medium">{customer.name}</span>
        </div>

        {/* Profile card */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center
                              rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {initials(customer.name)}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{customer.name}</h1>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {customer.phone}
                    </span>
                  )}
                  {customer.email && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {customer.email}
                    </span>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {customer.address}
                    </span>
                  )}
                  {customer.kra_pin && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {customer.kra_pin}
                    </span>
                  )}

                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {canEdit && (
                <button onClick={() => setShowEdit(true)} className="btn-secondary w-auto px-4 text-xs">
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-secondary w-auto px-4 text-xs text-red-500 border-red-200 hover:bg-red-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-gray-900">{devices.length}</p>
              <p className="text-xs text-gray-400">Devices</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{tickets.length}</p>
              <p className="text-xs text-gray-400">Tickets</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {tickets.filter((t) => t.status === 'CLOSED').length}
              </p>
              <p className="text-xs text-gray-400">Resolved</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200">
          {['devices', 'tickets'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 capitalize transition
                ${activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {tab === 'devices' ? devices.length : tickets.length}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Devices */}
        {activeTab === 'devices' && (
          <div className="space-y-3">
            {canEdit && (
              <div className="flex justify-end">
                <button onClick={() => setShowAddDevice(true)} className="btn-primary w-auto px-4 text-xs">
                  + Register device
                </button>
              </div>
            )}
            {devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-gray-400">
                <p className="text-sm">No devices registered for this customer.</p>
                {canEdit && (
                  <button onClick={() => setShowAddDevice(true)} className="mt-3 text-xs text-brand-600 hover:underline">
                    Register the first device →
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {devices.map((d) => (
                  <div key={d.device_id} className="card flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center
                                      rounded-xl bg-gray-100 text-gray-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{d.brand} {d.model}</p>
                        <p className="text-xs text-gray-400">{d.device_type}</p>
                        {d.serial_number && (
                          <p className="text-xs text-gray-400 mt-0.5">S/N: {d.serial_number}</p>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setEditDevice(d)}
                        className="text-xs text-gray-400 hover:text-brand-600 flex-shrink-0"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Tickets */}
        {activeTab === 'tickets' && (
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-gray-400">
                <p className="text-sm">No tickets for this customer yet.</p>
              </div>
            ) : (
              <div className="card p-0 divide-y divide-gray-50">
                {tickets.map((t) => (
                  <button
                    key={t.ticket_id}
                    onClick={() => navigate(`/tickets/${t.ticket_id}`)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left
                               hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.status} />
                        {t.ticket_type && (
                          <span className="text-xs text-gray-400">{t.ticket_type}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {t.device_brand} {t.device_model}
                        {!t.device_brand && !t.device_model && 'No device'}
                      </p>
                      {t.assigned_to && (
                        <p className="text-xs text-gray-400">Assigned: {t.assigned_to}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
                      <svg className="h-4 w-4 text-gray-300 mt-1 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {showEdit && (
        <CustomerFormModal
          customer={customer}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); refresh(); }}
        />
      )}

      {showAddDevice && (
        <DeviceFormModal
          customerId={customer.customer_id}
          customerName={customer.name}
          onClose={() => setShowAddDevice(false)}
          onSaved={() => { setShowAddDevice(false); refresh(); }}
        />
      )}

      {editDevice && (
        <DeviceFormModal
          device={editDevice}
          customerId={customer.customer_id}
          customerName={customer.name}
          onClose={() => setEditDevice(null)}
          onSaved={() => { setEditDevice(null); refresh(); }}
        />
      )}
    </AppLayout>
  );
};

export default CustomerDetailPage;