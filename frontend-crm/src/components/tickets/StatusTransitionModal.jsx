import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateTicketStatus } from '../../api/tickets.api';

const TRANSITIONS = {
  NEW:                ['ASSIGNED'],
  ASSIGNED:           ['IN_PROGRESS'],
  IN_PROGRESS:        ['CLOSED_CUST_PICKUP'],
  CLOSED_CUST_PICKUP: ['CLOSED', 'REOPENED'],
  CLOSED:             ['REOPENED'],
  REOPENED:           ['IN_PROGRESS', 'ESCALATED'],
  ESCALATED:          ['IN_PROGRESS'],
};

const STATUS_LABELS = {
  NEW:                'New',
  ASSIGNED:           'Assigned',
  IN_PROGRESS:        'In progress',
  CLOSED_CUST_PICKUP: 'Ready for pickup',
  CLOSED:             'Closed',
  REOPENED:           'Reopened',
  ESCALATED:          'Escalated',
};

const STATUS_COLORS = {
  NEW:                'border-blue-300   bg-blue-50   text-blue-700',
  ASSIGNED:           'border-indigo-300 bg-indigo-50 text-indigo-700',
  IN_PROGRESS:        'border-yellow-300 bg-yellow-50 text-yellow-700',
  CLOSED_CUST_PICKUP: 'border-teal-300   bg-teal-50   text-teal-700',
  CLOSED:             'border-green-300  bg-green-50  text-green-700',
  REOPENED:           'border-orange-300 bg-orange-50 text-orange-700',
  ESCALATED:          'border-red-300    bg-red-50    text-red-700',
};

const StatusTransitionModal = ({ ticket, onClose, onUpdated }) => {
  const allowed   = TRANSITIONS[ticket.status] || [];
  const [selected, setSelected] = useState(allowed[0] || '');
  const [loading,  setLoading]  = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await updateTicketStatus(ticket.ticket_id, selected);
      toast.success(`Status updated to ${STATUS_LABELS[selected]}`);
      onUpdated(data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Update status</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Current:</span>
            <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>

          {allowed.length === 0 ? (
            <p className="text-sm text-gray-500">No transitions available for this status.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Move to:</p>
              {allowed.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition
                    ${selected === s ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`h-3 w-3 rounded-full flex-shrink-0 ${
                    s === 'CLOSED' || s === 'CLOSED_CUST_PICKUP' ? 'bg-green-400' :
                    s === 'ESCALATED' ? 'bg-red-400' :
                    s === 'REOPENED' ? 'bg-orange-400' :
                    'bg-brand-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-800">{STATUS_LABELS[s]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="btn-secondary w-auto px-5">Cancel</button>
          {allowed.length > 0 && (
            <button
              onClick={handleConfirm}
              disabled={loading || !selected}
              className="btn-primary w-auto px-6"
            >
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Updating...</>
                : 'Confirm'
              }
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default StatusTransitionModal;