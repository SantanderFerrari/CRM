import { useNavigate } from 'react-router-dom';
import AppLayout    from '../components/layout/AppLayout';
import StatCard     from '../components/common/StatCard';
import StatusBadge  from '../components/common/StatusBadge';
import BarChart     from '../components/common/BarChart';
import useDashboard from '../hooks/useDashboard';
import { useAuth }  from '../context/AuthContext';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
};

const MonthBadge = ({ pct }) => {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span className={'ml-1 text-xs font-medium ' + (up ? 'text-green-600' : 'text-red-500')}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs last month
    </span>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useDashboard();
  const navigate = useNavigate();
  const s = data?.summary;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Good day, {user?.name}</h1>
            <p className="text-sm text-gray-500">Here's what's happening today</p>
          </div>
          <button onClick={refresh} className="btn-secondary w-auto px-4 text-xs flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Open tickets"    value={s?.total_open}
            sub={<span>This month: {s?.this_month ?? '—'}<MonthBadge pct={s?.month_change_pct} /></span>}
            color="blue" loading={loading} />
          <StatCard label="Escalated"       value={s?.escalated}
            sub="Needs attention" color={s?.escalated > 0 ? 'red' : 'gray'} loading={loading} />
          <StatCard label="Closed"          value={s?.closed}
            sub="Total resolved" color="green" loading={loading} />
          <StatCard label="Avg resolution"  value={s?.avg_resolution_hrs != null ? s.avg_resolution_hrs + 'h' : '—'}
            sub="Closed tickets" color="purple" loading={loading} />
        </div>

        {/* Status breakdown + chart */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Tickets by status</h2>
            {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-gray-100" />) :
              [
                { label: 'New',         value: s?.new,         color: 'bg-blue-400' },
                { label: 'Assigned',    value: s?.assigned,    color: 'bg-indigo-400' },
                { label: 'In progress', value: s?.in_progress, color: 'bg-yellow-400' },
                { label: 'Reopened',    value: s?.reopened,    color: 'bg-orange-400' },
                { label: 'Escalated',   value: s?.escalated,   color: 'bg-red-400' },
              ].map(({ label, value, color }) => {
                const pct = Math.round(((value || 0) / Math.max(s?.total_open || 1, 1)) * 100);
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{label}</span><span className="font-medium">{value ?? 0}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div className={'h-1.5 rounded-full ' + color + ' transition-all duration-500'} style={{ width: pct + '%' }} />
                    </div>
                  </div>
                );
              })
            }
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Tickets created — last 14 days</h2>
            {loading
              ? <div className="h-16 animate-pulse rounded bg-gray-100" />
              : <BarChart data={data?.daily_tickets ?? []} color="#4f46e5" height={25} />
            }
          </div>
        </div>

        {/* Technician workload + escalated */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Technician workload</h2>
            {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-8 mb-2 animate-pulse rounded bg-gray-100" />) :
              !data?.technicians?.length ? <p className="text-sm text-gray-400">No technicians found.</p> :
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="pb-2 text-left font-medium">Technician</th>
                    <th className="pb-2 text-center font-medium">In progress</th>
                    <th className="pb-2 text-center font-medium">Closed</th>
                    <th className="pb-2 text-center font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.technicians.map((t) => (
                    <tr key={t.user_id} className="text-gray-700">
                      <td className="py-2.5 font-medium">{t.name}</td>
                      <td className="py-2.5 text-center"><span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{t.in_progress}</span></td>
                      <td className="py-2.5 text-center"><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{t.closed}</span></td>
                      <td className="py-2.5 text-center font-semibold">{t.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Escalated tickets</h2>
              {s?.escalated > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">{s.escalated} open</span>}
            </div>
            {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-12 mb-2 animate-pulse rounded bg-gray-100" />) :
              !data?.escalated_tickets?.length
                ? <div className="flex flex-col items-center py-8 text-gray-400">
                    <svg className="h-8 w-8 mb-2 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm">No escalated tickets</p>
                  </div>
                : <div className="space-y-2">
                    {data.escalated_tickets.map((t) => (
                      <div key={t.ticket_id} onClick={() => navigate('/tickets/' + t.ticket_id)}
                        className="flex items-start justify-between rounded-lg border border-red-100 bg-red-50 p-3 cursor-pointer hover:bg-red-100 transition">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{t.customer_name}</p>
                          <p className="text-xs text-gray-500">{t.device_brand} {t.device_model} · Reopened {t.reopen_count}×</p>
                          {t.assigned_to && <p className="text-xs text-gray-400">Assigned: {t.assigned_to}</p>}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{timeAgo(t.created_at)}</span>
                      </div>
                    ))}
                  </div>
            }
          </div>
        </div>

        {/* Recent tickets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent tickets</h2>
            <button onClick={() => navigate('/tickets')} className="text-xs font-medium text-brand-600 hover:text-brand-700">View all →</button>
          </div>
          {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-10 mb-2 animate-pulse rounded bg-gray-100" />) :
            !data?.recent_tickets?.length ? <p className="text-sm text-gray-400">No tickets yet.</p> :
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500">
                    <th className="pb-2 text-left font-medium">Customer</th>
                    <th className="pb-2 text-left font-medium">Device</th>
                    <th className="pb-2 text-left font-medium">Type</th>
                    <th className="pb-2 text-left font-medium">Status</th>
                    <th className="pb-2 text-left font-medium">Assigned to</th>
                    <th className="pb-2 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recent_tickets.map((t) => (
                    <tr key={t.ticket_id} onClick={() => navigate('/tickets/' + t.ticket_id)}
                      className="cursor-pointer hover:bg-gray-50 transition">
                      <td className="py-3 font-medium text-gray-800">{t.customer_name}</td>
                      <td className="py-3 text-gray-600">{t.device_brand} {t.device_model}</td>
                      <td className="py-3 text-gray-500">{t.ticket_type || '—'}</td>
                      <td className="py-3"><StatusBadge status={t.status} /></td>
                      <td className="py-3 text-gray-500">{t.assigned_to || '—'}</td>
                      <td className="py-3 text-xs text-gray-400">{timeAgo(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>
    </AppLayout>
  );
};

export default DashboardPage;