import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout        from '../components/layout/AppLayout';
import StatusBadge      from '../components/common/StatusBadge';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import useTickets       from '../hooks/useTickets';
import { useAuth }      from '../context/AuthContext';

const STATUSES = ['', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED_CUST_PICKUP', 'CLOSED', 'REOPENED', 'ESCALATED'];

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
};

const TicketsPage = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { tickets, loading, error, filters, applyFilters, refresh } = useTickets();
  const [showCreate, setShowCreate] = useState(false);

  const canCreate = ['CUSTOMER_CARE', 'ADMIN'].includes(user?.role);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
            <p className="text-sm text-gray-500">{tickets.length} tickets loaded</p>
          </div>
          <div className="flex gap-3">
            <button onClick={refresh} className="btn-secondary w-auto px-4 text-xs flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            {canCreate && (
              <button onClick={() => setShowCreate(true)} className="btn-primary w-auto px-5">
                + New ticket
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <select
            className="input w-auto"
            value={filters.status}
            onChange={(e) => applyFilters({ status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'All statuses'}</option>
            ))}
          </select>

          {/* My tickets toggle */}
          {['TECHNICIAN', 'SUPERVISOR'].includes(user?.role) && (
            <button
              onClick={() => applyFilters({
                assigned_user_id: filters.assigned_user_id ? '' : user.user_id,
              })}
              className={`btn-secondary w-auto px-4 text-xs transition
                ${filters.assigned_user_id ? 'bg-brand-50 border-brand-300 text-brand-700' : ''}`}
            >
              {filters.assigned_user_id ? '✓ My tickets' : 'My tickets'}
            </button>
          )}

          {/* Clear filters */}
          {(filters.status || filters.assigned_user_id) && (
            <button
              onClick={() => applyFilters({ status: '', assigned_user_id: '' })}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="space-y-0 divide-y divide-gray-100">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100 ml-auto" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="h-10 w-10 mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium">No tickets found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-xs text-gray-500">
                    <th className="px-6 py-3 text-left font-medium">Customer</th>
                    <th className="px-6 py-3 text-left font-medium">Device</th>
                    <th className="px-6 py-3 text-left font-medium">Type</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Assigned to</th>
                    <th className="px-6 py-3 text-left font-medium">Created</th>
                    <th className="px-6 py-3 text-left font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t) => (
                    <tr
                      key={t.ticket_id}
                      onClick={() => navigate(`/tickets/${t.ticket_id}`)}
                      className="cursor-pointer hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">{t.customer_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {t.device_brand && t.device_model
                          ? `${t.device_brand} ${t.device_model}`
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{t.ticket_type || '—'}</td>
                      <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                      <td className="px-6 py-4 text-gray-500">{t.assigned_to || <span className="text-gray-300">Unassigned</span>}</td>
                      <td className="px-6 py-4 text-xs text-gray-400">{timeAgo(t.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {t.escalation_flag && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Escalated</span>
                          )}
                          {t.duplicate_flag && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-600">Duplicate</span>
                          )}
                        </div>
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
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={(ticket) => {
            setShowCreate(false);
            navigate(`/tickets/${ticket.ticket_id}`);
          }}
        />
      )}
    </AppLayout>
  );
};

export default TicketsPage;