import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppLayout             from '../components/layout/AppLayout';
import StatusBadge           from '../components/common/StatusBadge';
import StatusTransitionModal from '../components/tickets/StatusTransitionModal';
import AssignModal           from '../components/tickets/AssignModal';
import useTicket             from '../hooks/useTicket';
import { useAuth }           from '../context/AuthContext';
import { addAccessory, addConditionReport } from '../api/tickets.api';

const CONDITION_OPTIONS = ['GOOD', 'FAIR', 'DAMAGED', 'CRITICAL'];

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-medium text-gray-400 w-32 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-800 text-right">{value || <span className="text-gray-300">—</span>}</span>
  </div>
);

const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';

const TicketDetailPage = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { ticket, loading, error, refresh } = useTicket(id);

  const [showStatus, setShowStatus]   = useState(false);
  const [showAssign, setShowAssign]   = useState(false);
  const [activeTab,  setActiveTab]    = useState('details');

  // Accessory form
  const [accForm,     setAccForm]     = useState({ description: '', condition: 'GOOD', notes: '' });
  const [accLoading,  setAccLoading]  = useState(false);

  // Condition report form
  const [condForm,    setCondForm]    = useState({ condition_summary: 'GOOD', condition_notes: '', inspection_name: '' });
  const [condLoading, setCondLoading] = useState(false);

  const canAssign       = ['CUSTOMER_CARE', 'SUPERVISOR', 'ADMIN'].includes(user?.role);
  const canUpdateStatus = user && ticket && ticket.status !== 'CLOSED';

  const handleAddAccessory = async (e) => {
    e.preventDefault();
    if (!accForm.description.trim()) { toast.error('Description is required.'); return; }
    setAccLoading(true);
    try {
      await addAccessory(id, accForm);
      toast.success('Accessory logged.');
      setAccForm({ description: '', condition: 'GOOD', notes: '' });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add accessory.');
    } finally { setAccLoading(false); }
  };

  const handleAddConditionReport = async (e) => {
    e.preventDefault();
    setCondLoading(true);
    try {
      await addConditionReport(id, condForm);
      toast.success('Condition report saved.');
      setCondForm({ condition_summary: 'GOOD', condition_notes: '', inspection_name: '' });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save report.');
    } finally { setCondLoading(false); }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    </AppLayout>
  );

  if (error || !ticket) return (
    <AppLayout>
      <div className="p-8 text-center text-sm text-red-500">{error || 'Ticket not found.'}</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/tickets')} className="hover:text-gray-600">Tickets</button>
          <span>/</span>
          <span className="text-gray-600 font-medium">{ticket.customer_name}</span>
        </div>

        {/* Header card */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-semibold text-gray-900">{ticket.customer_name}</h1>
                <StatusBadge status={ticket.status} />
                {ticket.escalation_flag && (
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">Escalated</span>
                )}
                {ticket.duplicate_flag && (
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-600">Duplicate</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {ticket.device_brand} {ticket.device_model}
                {ticket.device_serial && ` · S/N: ${ticket.device_serial}`}
              </p>
              <p className="text-xs text-gray-400">Created {formatDate(ticket.created_at)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {canAssign && (
                <button onClick={() => setShowAssign(true)} className="btn-secondary w-auto px-4 text-xs">
                  {ticket.assigned_to ? 'Reassign' : 'Assign'}
                </button>
              )}
              {canUpdateStatus && (
                <button onClick={() => setShowStatus(true)} className="btn-primary w-auto px-4 text-xs">
                  Update status
                </button>
              )}
            </div>
          </div>

          {ticket.reopen_count > 0 && (
            <div className="mt-3 rounded-lg bg-orange-50 border border-orange-200 px-4 py-2 text-xs text-orange-700">
              This ticket has been reopened {ticket.reopen_count} time{ticket.reopen_count > 1 ? 's' : ''}.
              {ticket.reopen_count >= 2 && ' Consider escalating.'}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-0">
          {['details', 'accessories', 'condition'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition capitalize
                ${activeTab === tab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'condition' ? 'Condition reports' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'accessories' && ticket.accessories?.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  {ticket.accessories.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Details */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Customer</h3>
              <InfoRow label="Name"   value={ticket.customer_name} />
              <InfoRow label="Phone"  value={ticket.customer_phone} />
              <InfoRow label="Email"  value={ticket.customer_email} />
            </div>

            <div className="card">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Device</h3>
              <InfoRow label="Brand"   value={ticket.device_brand} />
              <InfoRow label="Model"   value={ticket.device_model} />
              <InfoRow label="Type"    value={ticket.device_type} />
              <InfoRow label="Serial"  value={ticket.device_serial} />
            </div>

            <div className="card sm:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Ticket info</h3>
              <InfoRow label="Ticket type"  value={ticket.ticket_type} />
              <InfoRow label="Assigned to"  value={ticket.assigned_to} />
              <InfoRow label="Reopened"     value={ticket.reopen_count > 0 ? `${ticket.reopen_count}×` : 'Never'} />
              <InfoRow label="Created"      value={formatDate(ticket.created_at)} />
              <InfoRow label="Closed"       value={formatDate(ticket.closed_at)} />
              {ticket.notes && (
                <div className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
                  {ticket.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Accessories */}
        {activeTab === 'accessories' && (
          <div className="space-y-4">
            {/* List */}
            {ticket.accessories?.length === 0 ? (
              <div className="card text-center py-10 text-gray-400 text-sm">No accessories logged yet.</div>
            ) : (
              <div className="card p-0 divide-y divide-gray-100">
                {ticket.accessories.map((a) => (
                  <div key={a.accessory_id} className="flex items-start justify-between px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a.description}</p>
                      {a.notes && <p className="text-xs text-gray-400 mt-0.5">{a.notes}</p>}
                    </div>
                    <span className={`ml-4 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${a.condition === 'GOOD' ? 'bg-green-100 text-green-700' :
                        a.condition === 'FAIR' ? 'bg-yellow-100 text-yellow-700' :
                        a.condition === 'DAMAGED' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'}`}>
                      {a.condition}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Log accessory</h3>
              <form onSubmit={handleAddAccessory} className="space-y-3">
                <div>
                  <label className="form-label">Description</label>
                  <input className="input" placeholder="e.g. Original charger" value={accForm.description}
                    onChange={(e) => setAccForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Condition</label>
                    <select className="input" value={accForm.condition}
                      onChange={(e) => setAccForm((p) => ({ ...p, condition: e.target.value }))}>
                      {CONDITION_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input className="input" placeholder="Extra details..." value={accForm.notes}
                      onChange={(e) => setAccForm((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" disabled={accLoading} className="btn-primary w-auto px-5">
                  {accLoading ? 'Logging...' : 'Log accessory'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab: Condition reports */}
        {activeTab === 'condition' && (
          <div className="space-y-4">
            {ticket.condition_reports?.length === 0 ? (
              <div className="card text-center py-10 text-gray-400 text-sm">No condition reports yet.</div>
            ) : (
              <div className="card p-0 divide-y divide-gray-100">
                {ticket.condition_reports.map((r) => (
                  <div key={r.report_id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800">{r.inspection_name || 'Inspection'}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${r.condition_summary === 'GOOD' ? 'bg-green-100 text-green-700' :
                          r.condition_summary === 'FAIR' ? 'bg-yellow-100 text-yellow-700' :
                          r.condition_summary === 'DAMAGED' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'}`}>
                        {r.condition_summary}
                      </span>
                    </div>
                    {r.condition_notes && <p className="text-xs text-gray-500">{r.condition_notes}</p>}
                    <p className="text-xs text-gray-300 mt-1">{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Add condition report</h3>
              <form onSubmit={handleAddConditionReport} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Condition</label>
                    <select className="input" value={condForm.condition_summary}
                      onChange={(e) => setCondForm((p) => ({ ...p, condition_summary: e.target.value }))}>
                      {CONDITION_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Inspection name</label>
                    <input className="input" placeholder="e.g. Initial inspection" value={condForm.inspection_name}
                      onChange={(e) => setCondForm((p) => ({ ...p, inspection_name: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea className="input resize-none" rows={3} placeholder="Describe the condition..."
                    value={condForm.condition_notes}
                    onChange={(e) => setCondForm((p) => ({ ...p, condition_notes: e.target.value }))} />
                </div>
                <button type="submit" disabled={condLoading} className="btn-primary w-auto px-5">
                  {condLoading ? 'Saving...' : 'Save report'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {showStatus && (
        <StatusTransitionModal
          ticket={ticket}
          onClose={() => setShowStatus(false)}
          onUpdated={(updated) => { setShowStatus(false); refresh(); }}
        />
      )}

      {showAssign && (
        <AssignModal
          ticket={ticket}
          onClose={() => setShowAssign(false)}
          onUpdated={() => { setShowAssign(false); refresh(); }}
        />
      )}
    </AppLayout>
  );
};

export default TicketDetailPage;