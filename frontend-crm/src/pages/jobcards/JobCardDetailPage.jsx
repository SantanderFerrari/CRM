import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppLayout     from '../../components/layout/AppLayout';
import JCStatusBadge from '../../components/jobcards/JCStatusBadge';
import StatusBadge   from '../../components/common/StatusBadge';
import useJobCard    from '../../hooks/useJobCard';
import { useAuth }   from '../../context/AuthContext';
import {
  updateJobCardStatus, addChecklistItem, toggleChecklist,
  addTimeLog, addPartsUsed, createRequisition,
  approveRequisition, rejectRequisition, addIncident, getInventory,
} from '../../api/jobcards.api';

const JC_TRANSITIONS = {
  CREATED:          ['CHECKLIST_PENDING'],
  CHECKLIST_PENDING:['IN_PROGRESS'],
  IN_PROGRESS:      ['COMPLETED'],
  COMPLETED:        ['PENDING_APPROVAL','CLOSED'],
  PENDING_APPROVAL: ['CLOSED','IN_PROGRESS'],
};

const JC_STATUS_LABELS = {
  CREATED:'Created', CHECKLIST_PENDING:'Checklist pending',
  IN_PROGRESS:'In progress', COMPLETED:'Completed',
  PENDING_APPROVAL:'Pending approval', CLOSED:'Closed',
};

const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';
const minsToHrs  = (m) => m != null ? `${Math.floor(m/60)}h ${m%60}m` : '—';

const JobCardDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobCard, loading, error, refresh } = useJobCard(id);

  const [activeTab,    setActiveTab]    = useState('checklist');
  const [updating,     setUpdating]     = useState(false);
  const [inventory,    setInventory]    = useState([]);
  const [invLoaded,    setInvLoaded]    = useState(false);

  // Form states
  const [newItem,      setNewItem]      = useState('');
  const [timeForm,     setTimeForm]     = useState({ start_time:'', end_time:'', notes:'' });
  const [partForm,     setPartForm]     = useState({ inventory_id:'', quantity_used:1 });
  const [reqForm,      setReqForm]      = useState({ inventory_id:'', quantity_requested:1 });
  const [incidentDesc, setIncidentDesc] = useState('');
  const [notesForm,    setNotesForm]    = useState({ repair_notes:'', diagnosis_notes:'' });

  const isTech = ['TECHNICIAN','ADMIN'].includes(user?.role);
  const isSup  = ['SUPERVISOR','ADMIN'].includes(user?.role);
  const allowed = jobCard ? (JC_TRANSITIONS[jobCard.status] || []) : [];

  const loadInventory = async () => {
    if (invLoaded) return;
    try {
      const { data } = await getInventory();
      setInventory(data.inventory);
      setInvLoaded(true);
    } catch { toast.error('Failed to load inventory.'); }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await updateJobCardStatus(id, {
        status: newStatus,
        repair_notes:      notesForm.repair_notes     || undefined,
        diagnosis_notes:   notesForm.diagnosis_notes  || undefined,
        approval_deferred: newStatus === 'CLOSED' ? !jobCard.supervisor_id : undefined,
      });
      toast.success(`Status updated to ${JC_STATUS_LABELS[newStatus]}`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally { setUpdating(false); }
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      await addChecklistItem(id, newItem.trim());
      setNewItem('');
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleToggle = async (cid, current) => {
    try {
      await toggleChecklist(id, cid, !current);
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleTimeLog = async (e) => {
    e.preventDefault();
    if (!timeForm.start_time) { toast.error('Start time required.'); return; }
    try {
      await addTimeLog(id, timeForm);
      toast.success('Time logged.');
      setTimeForm({ start_time:'', end_time:'', notes:'' });
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handlePartsUsed = async (e) => {
    e.preventDefault();
    if (!partForm.inventory_id) { toast.error('Select a part.'); return; }
    try {
      await addPartsUsed(id, partForm);
      toast.success('Parts logged.');
      setPartForm({ inventory_id:'', quantity_used:1 });
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Insufficient stock or invalid part.'); }
  };

  const handleRequisition = async (e) => {
    e.preventDefault();
    if (!reqForm.inventory_id) { toast.error('Select a part.'); return; }
    try {
      await createRequisition(id, reqForm);
      toast.success('Requisition raised.');
      setReqForm({ inventory_id:'', quantity_requested:1 });
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleIncident = async (e) => {
    e.preventDefault();
    if (!incidentDesc.trim()) { toast.error('Description required.'); return; }
    try {
      await addIncident(id, { description: incidentDesc });
      toast.success('Incident logged.');
      setIncidentDesc('');
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  if (loading) return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    </AppLayout>
  );

  if (error || !jobCard) return (
    <AppLayout>
      <div className="p-8 text-center text-sm text-red-500">{error || 'Job card not found.'}</div>
    </AppLayout>
  );

  const checklistPct = jobCard.checklist?.length
    ? Math.round((jobCard.checklist.filter(c => c.is_completed).length / jobCard.checklist.length) * 100)
    : 0;

  const totalMins = jobCard.time_logs?.reduce((sum, tl) => {
    if (!tl.end_time) return sum;
    return sum + Math.round((new Date(tl.end_time) - new Date(tl.start_time)) / 60000);
  }, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-5xl">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={() => navigate('/job-cards')} className="hover:text-gray-600">Job Cards</button>
          <span>/</span>
          <span className="text-gray-600 font-medium">{jobCard.customer_name}</span>
        </div>

        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg font-semibold text-gray-900">{jobCard.customer_name}</h1>
                <JCStatusBadge status={jobCard.status} />
                <StatusBadge status={jobCard.ticket_status} />
              </div>
              <p className="text-sm text-gray-500">
                {jobCard.device_brand} {jobCard.device_model}
                {jobCard.device_serial && ` · S/N: ${jobCard.device_serial}`}
              </p>
              <p className="text-xs text-gray-400">
                Technician: <span className="font-medium">{jobCard.technician_name}</span>
                {jobCard.supervisor_name && ` · Supervisor: ${jobCard.supervisor_name}`}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/tickets/${jobCard.ticket_id}`)}
                className="btn-secondary w-auto px-4 text-xs"
              >
                View ticket →
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{checklistPct}%</p>
              <p className="text-xs text-gray-400">Checklist done</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{minsToHrs(totalMins)}</p>
              <p className="text-xs text-gray-400">Time logged</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{jobCard.parts_used?.length ?? 0}</p>
              <p className="text-xs text-gray-400">Parts used</p>
            </div>
          </div>

          {/* Status transitions */}
          {allowed.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-2">Move to:</p>
              <div className="flex flex-wrap gap-2">
                {allowed.map((s) => (
                  <button key={s} onClick={() => handleStatusUpdate(s)}
                    disabled={updating}
                    className="btn-primary w-auto px-4 text-xs">
                    {updating ? '...' : JC_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {isTech && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Diagnosis & repair notes</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Diagnosis notes</label>
                <textarea className="input resize-none" rows={2}
                  placeholder="What was found..."
                  value={notesForm.diagnosis_notes}
                  onChange={(e) => setNotesForm(p => ({...p, diagnosis_notes: e.target.value}))} />
              </div>
              <div>
                <label className="form-label">Repair notes</label>
                <textarea className="input resize-none" rows={2}
                  placeholder="What was done..."
                  value={notesForm.repair_notes}
                  onChange={(e) => setNotesForm(p => ({...p, repair_notes: e.target.value}))} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Notes are saved when you update the status.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 gap-0 overflow-x-auto">
          {['checklist','time','parts','requisitions','incidents'].map((tab) => {
            const counts = {
              checklist: jobCard.checklist?.length,
              time: jobCard.time_logs?.length,
              parts: jobCard.parts_used?.length,
              requisitions: jobCard.requisitions?.length,
              incidents: jobCard.incidents?.length,
            };
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); if (['parts','requisitions'].includes(tab)) loadInventory(); }}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition
                  ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.replace('requisitions','Requisitions')}
                {counts[tab] > 0 && (
                  <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                    {counts[tab]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-3">
            {jobCard.checklist?.length > 0 && (
              <div className="card p-0 divide-y divide-gray-100">
                {jobCard.checklist.map((item) => (
                  <div key={item.checklist_id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                    <button
                      onClick={() => isTech && handleToggle(item.checklist_id, item.is_completed)}
                      disabled={!isTech}
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded
                        border-2 transition
                        ${item.is_completed
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-gray-300 hover:border-brand-400'}`}
                    >
                      {item.is_completed && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className={`text-sm flex-1 ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.item_name}
                    </span>
                    {item.completed_at && (
                      <span className="text-xs text-gray-400">{formatDate(item.completed_at)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isTech && (
              <form onSubmit={handleAddChecklistItem} className="card flex gap-3">
                <input className="input flex-1" placeholder="Add checklist item..."
                  value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                <button type="submit" className="btn-primary w-auto px-5 flex-shrink-0">Add</button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Time logs */}
        {activeTab === 'time' && (
          <div className="space-y-3">
            {jobCard.time_logs?.length > 0 && (
              <div className="card p-0 divide-y divide-gray-100">
                {jobCard.time_logs.map((tl) => {
                  const mins = tl.end_time
                    ? Math.round((new Date(tl.end_time) - new Date(tl.start_time)) / 60000)
                    : null;
                  return (
                    <div key={tl.time_log_id} className="flex items-start justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tl.technician_name}</p>
                        <p className="text-xs text-gray-400">
                          {formatDate(tl.start_time)} → {tl.end_time ? formatDate(tl.end_time) : 'In progress'}
                        </p>
                        {tl.notes && <p className="text-xs text-gray-400 mt-0.5">{tl.notes}</p>}
                      </div>
                      <span className="text-sm font-semibold text-brand-600 ml-4 flex-shrink-0">
                        {mins != null ? minsToHrs(mins) : '—'}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center px-5 py-3 bg-gray-50">
                  <span className="text-xs font-medium text-gray-500">Total time</span>
                  <span className="text-sm font-bold text-gray-800">{minsToHrs(totalMins)}</span>
                </div>
              </div>
            )}
            {isTech && (
              <form onSubmit={handleTimeLog} className="card space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Log time</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Start time</label>
                    <input type="datetime-local" className="input"
                      value={timeForm.start_time}
                      onChange={(e) => setTimeForm(p => ({...p, start_time: e.target.value}))} />
                  </div>
                  <div>
                    <label className="form-label">End time <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="datetime-local" className="input"
                      value={timeForm.end_time}
                      onChange={(e) => setTimeForm(p => ({...p, end_time: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Notes</label>
                  <input className="input" placeholder="What was worked on..."
                    value={timeForm.notes}
                    onChange={(e) => setTimeForm(p => ({...p, notes: e.target.value}))} />
                </div>
                <button type="submit" className="btn-primary w-auto px-5">Log time</button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Parts used */}
        {activeTab === 'parts' && (
          <div className="space-y-3">
            {jobCard.parts_used?.length > 0 && (
              <div className="card p-0 divide-y divide-gray-100">
                {jobCard.parts_used.map((p) => (
                  <div key={p.parts_used_id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.part_name}</p>
                      <p className="text-xs text-gray-400">SKU: {p.sku || '—'}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">×{p.quantity_used}</span>
                  </div>
                ))}
              </div>
            )}
            {isTech && (
              <form onSubmit={handlePartsUsed} className="card space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Log parts used</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Part</label>
                    <select className="input" value={partForm.inventory_id}
                      onChange={(e) => setPartForm(p => ({...p, inventory_id: e.target.value}))}>
                      <option value="">Select part...</option>
                      {inventory.map((i) => (
                        <option key={i.inventory_id} value={i.inventory_id}>
                          {i.part_name} (stock: {i.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Quantity</label>
                    <input type="number" min={1} className="input" value={partForm.quantity_used}
                      onChange={(e) => setPartForm(p => ({...p, quantity_used: parseInt(e.target.value)}))} />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-auto px-5">Log parts</button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Requisitions */}
        {activeTab === 'requisitions' && (
          <div className="space-y-3">
            {jobCard.requisitions?.length > 0 && (
              <div className="card p-0 divide-y divide-gray-100">
                {jobCard.requisitions.map((r) => (
                  <div key={r.requisition_id} className="flex items-start justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.part_name}</p>
                      <p className="text-xs text-gray-400">
                        Qty: {r.quantity_requested} · By: {r.requested_by_name}
                      </p>
                      {r.approved_by_name && (
                        <p className="text-xs text-gray-400">
                          {r.status === 'APPROVED' ? 'Approved' : 'Rejected'} by: {r.approved_by_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          r.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {r.status}
                      </span>
                      {isSup && r.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <button
                            onClick={async () => { await approveRequisition(id, r.requisition_id); toast.success('Approved.'); refresh(); }}
                            className="rounded bg-green-500 px-2 py-0.5 text-xs text-white hover:bg-green-600">
                            Approve
                          </button>
                          <button
                            onClick={async () => { await rejectRequisition(id, r.requisition_id); toast.success('Rejected.'); refresh(); }}
                            className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isTech && (
              <form onSubmit={handleRequisition} className="card space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Raise stock requisition</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Part</label>
                    <select className="input" value={reqForm.inventory_id}
                      onChange={(e) => setReqForm(p => ({...p, inventory_id: e.target.value}))}>
                      <option value="">Select part...</option>
                      {inventory.map((i) => (
                        <option key={i.inventory_id} value={i.inventory_id}>
                          {i.part_name} (stock: {i.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Qty requested</label>
                    <input type="number" min={1} className="input" value={reqForm.quantity_requested}
                      onChange={(e) => setReqForm(p => ({...p, quantity_requested: parseInt(e.target.value)}))} />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-auto px-5">Raise requisition</button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Incidents */}
        {activeTab === 'incidents' && (
          <div className="space-y-3">
            {jobCard.incidents?.length > 0 && (
              <div className="card p-0 divide-y divide-gray-100">
                {jobCard.incidents.map((inc) => (
                  <div key={inc.incident_id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-red-600">Incident</p>
                      <p className="text-xs text-gray-400">{formatDate(inc.created_at)}</p>
                    </div>
                    <p className="text-sm text-gray-800">{inc.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Reported by: {inc.reported_by_name}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleIncident} className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Log incident</h3>
              <textarea className="input resize-none" rows={3}
                placeholder="Describe the incident (e.g. accessory damaged, missing component)..."
                value={incidentDesc}
                onChange={(e) => setIncidentDesc(e.target.value)} />
              <button type="submit" className="btn-primary w-auto px-5">Log incident</button>
            </form>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default JobCardDetailPage;