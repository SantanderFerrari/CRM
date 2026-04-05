import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getTechnicians, assignTicket } from '../../api/tickets.api';

const AssignModal = ({ ticket, onClose, onUpdated }) => {
  const [technicians, setTechnicians] = useState([]);
  const [selected,    setSelected]    = useState(ticket.assigned_user_id || '');
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    setLoading(true);
    getTechnicians()
      .then(({ data }) => setTechnicians(data.users))
      .catch(() => toast.error('Failed to load technicians.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selected) { toast.error('Select a technician.'); return; }
    setSubmitting(true);
    try {
      const { data } = await assignTicket(ticket.ticket_id, selected);
      toast.success('Ticket assigned.');
      onUpdated(data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Assign technician</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />)}
            </div>
          ) : technicians.length === 0 ? (
            <p className="text-sm text-gray-400">No active technicians found.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {technicians.map((t) => (
                <button
                  key={t.user_id}
                  onClick={() => setSelected(t.user_id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition
                    ${selected === t.user_id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.email}</p>
                  </div>
                  {selected === t.user_id && (
                    <svg className="ml-auto h-4 w-4 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="btn-secondary w-auto px-5">Cancel</button>
          <button
            onClick={handleAssign}
            disabled={submitting || !selected}
            className="btn-primary w-auto px-6"
          >
            {submitting
              ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Assigning...</>
              : 'Assign'
            }
          </button>
        </div>

      </div>
    </div>
  );
};

export default AssignModal;