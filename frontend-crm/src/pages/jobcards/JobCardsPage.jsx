import { useCallback, useEffect, useState } from 'react';
import { useNavigate }  from 'react-router-dom';
import AppLayout        from '../../components/layout/AppLayout';
import JCStatusBadge    from '../../components/jobcards/JCStatusBadge';
import { useAuth }      from '../../context/AuthContext';
import { getJobCards }  from '../../api/jobcards.api';

const STATUSES = ['','CREATED','CHECKLIST_PENDING','IN_PROGRESS','COMPLETED','PENDING_APPROVAL','CLOSED'];

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
};

const JobCardsPage = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [jobCards,  setJobCards]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [status,    setStatus]    = useState('');
  const [myCards,   setMyCards]   = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (status) params.status = status;
      if (myCards && user?.user_id) params.technician_id = user.user_id;
      const { data } = await getJobCards(params);
      setJobCards(data.job_cards);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job cards.');
    } finally {
      setLoading(false);
    }
  }, [status, myCards, user]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Job Cards</h1>
            <p className="text-sm text-gray-500">{jobCards.length} job cards</p>
          </div>
          <button onClick={fetch} className="btn-secondary w-auto px-4 text-xs flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
          {user?.role === 'TECHNICIAN' && (
            <button
              onClick={() => setMyCards((p) => !p)}
              className={`btn-secondary w-auto px-4 text-xs
                ${myCards ? 'bg-brand-50 border-brand-300 text-brand-700' : ''}`}
            >
              {myCards ? '✓ My job cards' : 'My job cards'}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-100 ml-auto" />
                </div>
              ))}
            </div>
          ) : jobCards.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">No job cards found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr className="text-xs text-gray-500">
                    <th className="px-6 py-3 text-left font-medium">Customer</th>
                    <th className="px-6 py-3 text-left font-medium">Technician</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Checklist</th>
                    <th className="px-6 py-3 text-left font-medium">Ticket status</th>
                    <th className="px-6 py-3 text-left font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobCards.map((jc) => {
                    const checkPct = jc.checklist_total > 0
                      ? Math.round((jc.checklist_done / jc.checklist_total) * 100)
                      : null;
                    return (
                      <tr key={jc.job_card_id}
                        onClick={() => navigate(`/jobcards/${jc.job_card_id}`)}
                        className="cursor-pointer hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-800">{jc.customer_name}</td>
                        <td className="px-6 py-4 text-gray-600">{jc.technician_name}</td>
                        <td className="px-6 py-4"><JCStatusBadge status={jc.status} /></td>
                        <td className="px-6 py-4">
                          {checkPct !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-gray-100">
                                <div className="h-1.5 rounded-full bg-brand-500"
                                  style={{ width: checkPct + '%' }} />
                              </div>
                              <span className="text-xs text-gray-400">
                                {jc.checklist_done}/{jc.checklist_total}
                              </span>
                            </div>
                          ) : <span className="text-xs text-gray-300">No items</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">{jc.ticket_status}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">{timeAgo(jc.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default JobCardsPage;