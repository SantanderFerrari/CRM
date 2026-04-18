import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getLeaveRequests, createLeaveRequest,
  reviewLeaveRequest, cancelLeaveRequest, getLeaveBalance,
} from '../../api/profile.api';

const CATEGORIES = [
  { value: 'ANNUAL_LEAVE',       label: 'Annual Leave',       days: 21  },
  { value: 'SICK_LEAVE',         label: 'Sick Leave',         days: 14  },
  { value: 'MATERNITY_LEAVE',    label: 'Maternity Leave',    days: 90  },
  { value: 'PATERNITY_LEAVE',    label: 'Paternity Leave',    days: 14  },
  { value: 'COMPASSIONATE_LEAVE',label: 'Compassionate Leave',days: null},
];

const STATUS_COLORS = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-green-100  text-green-700',
  REJECTED:  'bg-red-100    text-red-700',
  CANCELLED: 'bg-gray-100   text-gray-500',
};

const CATEGORY_COLORS = {
  ANNUAL_LEAVE:       'bg-blue-100   text-blue-700',
  SICK_LEAVE:         'bg-orange-100 text-orange-700',
  MATERNITY_LEAVE:    'bg-pink-100   text-pink-700',
  PATERNITY_LEAVE:    'bg-teal-100   text-teal-700',
  COMPASSIONATE_LEAVE:'bg-purple-100 text-purple-700',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtTs = (d) => d ? new Date(d).toLocaleString('en-KE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const EMPTY_FORM = {
  category: 'ANNUAL_LEAVE', start_date: '', end_date: '',
  duty_resume_date: '', days_requested: '', reason: '',
  sick_certificate: false,
};

const LeavePage = () => {
  const { user } = useAuth();
  const isManager = ['SUPERVISOR','HEAD_OF_DEPARTMENT','HUMAN_RESOURCES','ADMIN'].includes(user?.role);

  const [leaves,   setLeaves]   = useState([]);
  const [balance,  setBalance]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab]  = useState(isManager ? 'all' : 'mine');
  const [reviewing, setReviewing]  = useState(null); // { leave, action }
  const [reviewNote, setReviewNote] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab === 'pending' ? { status: 'PENDING' } : {};
      const [leavesRes, balRes] = await Promise.all([
        getLeaveRequests(params),
        getLeaveBalance(),
      ]);
      setLeaves(leavesRes.data.leaves);
      setBalance(balRes.data.balance);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-calc days when dates change
  useEffect(() => {
    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end   = new Date(form.end_date);
      if (end >= start) {
        let days = 0;
        const cur = new Date(start);
        while (cur <= end) {
          const dow = cur.getDay();
          if (dow !== 0 && dow !== 6) days++; // exclude weekends
          cur.setDate(cur.getDate() + 1);
        }
        setForm(p => ({ ...p, days_requested: days }));
      }
    }
  }, [form.start_date, form.end_date]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.start_date)      errs.start_date      = 'Required.';
    if (!form.end_date)        errs.end_date        = 'Required.';
    if (!form.duty_resume_date)errs.duty_resume_date= 'Required.';
    if (!form.days_requested)  errs.days_requested  = 'Required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const { data } = await createLeaveRequest(form);
      if (data.warning) toast(data.warning, { icon: '⚠️', duration: 6000 });
      toast.success('Leave request submitted.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async () => {
    if (!reviewing) return;
    try {
      await reviewLeaveRequest(reviewing.leave.leave_id, {
        action: reviewing.action,
        review_notes: reviewNote,
      });
      toast.success(`Leave ${reviewing.action.toLowerCase()}.`);
      setReviewing(null);
      setReviewNote('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await cancelLeaveRequest(id);
      toast.success('Leave request cancelled.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const catInfo = (value) => CATEGORIES.find(c => c.value === value);

  return (
    <AppLayout>
      <div className="page-container max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Leave Requests</h1>
            <p className="text-sm text-gray-500">
              Available days: <span className="font-semibold text-green-600">
                {balance ? parseFloat(balance.available_days).toFixed(1) : '—'}
              </span> / 21
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary w-auto px-5">
            + Request leave
          </button>
        </div>

        {/* Balance bar */}
        {balance && (
          <div className="card">
            <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
              <span>Leave balance {new Date().getFullYear()}</span>
              <span>{parseFloat(balance.available_days).toFixed(1)} days available</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100">
              <div className="h-2.5 rounded-full bg-brand-500 transition-all"
                style={{ width: `${Math.min((balance.used_days / 21) * 100, 100)}%` }} />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              <span>Accrued: {parseFloat(balance.accrued_days).toFixed(1)}</span>
              <span>Used: {parseFloat(balance.used_days).toFixed(1)}</span>
              <span>Carried fwd: {parseFloat(balance.carried_forward).toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        {isManager && (
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all',     label: 'All requests' },
              { key: 'pending', label: 'Pending review' },
              { key: 'mine',    label: 'My requests' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition
                  ${activeTab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse h-20" />
            ))
          ) : leaves.length === 0 ? (
            <div className="card text-center py-10 text-gray-400 text-sm">
              No leave requests found.
            </div>
          ) : (
            leaves.map((l) => (
              <div key={l.leave_id} className="card">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[l.category]}`}>
                        {catInfo(l.category)?.label || l.category}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[l.status]}`}>
                        {l.status}
                      </span>
                      {l.overlap_flag && (
                        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs text-orange-700">
                          ⚠ Overlap
                        </span>
                      )}
                    </div>
                    {isManager && (
                      <p className="text-sm font-medium text-gray-800">{l.employee_name}
                        <span className="ml-2 text-xs font-normal text-gray-400">{l.employee_role?.replace(/_/g, ' ')}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{fmt(l.start_date)} → {fmt(l.end_date)}</span>
                      <span className="font-medium">{parseFloat(l.days_requested).toFixed(1)} days</span>
                      <span>Resumes: {fmt(l.duty_resume_date)}</span>
                    </div>
                    {l.reason && <p className="text-xs text-gray-400 truncate max-w-sm">{l.reason}</p>}
                    {l.reviewed_by_name && (
                      <p className="text-xs text-gray-400">
                        {l.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by {l.reviewed_by_name} · {fmtTs(l.reviewed_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    {/* Manager review buttons */}
                    {isManager && l.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReviewing({ leave: l, action: 'APPROVED' })}
                          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">
                          Approve
                        </button>
                        <button
                          onClick={() => setReviewing({ leave: l, action: 'REJECTED' })}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                          Reject
                        </button>
                      </div>
                    )}
                    {/* Employee cancel */}
                    {l.user_id === user?.user_id && l.status === 'PENDING' && (
                      <button onClick={() => handleCancel(l.leave_id)}
                        className="text-xs text-gray-400 hover:text-red-500 hover:underline">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Create leave request modal ──────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Request leave</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="overflow-y-auto">
              <div className="p-5 sm:p-6 space-y-4">

                <div>
                  <label className="form-label">Leave category</label>
                  <select name="category" className="input" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label} {c.days ? `(up to ${c.days} days)` : ''}
                      </option>
                    ))}
                  </select>
                  {form.category === 'SICK_LEAVE' && (
                    <p className="mt-1 text-xs text-orange-600">
                      A medical certificate is required. First 7 days full pay, next 7 days half pay.
                    </p>
                  )}
                  {form.category === 'MATERNITY_LEAVE' && (
                    <p className="mt-1 text-xs text-pink-600">90 calendar days full pay. Give at least 7 days notice.</p>
                  )}
                  {form.category === 'PATERNITY_LEAVE' && (
                    <p className="mt-1 text-xs text-teal-600">14 calendar days full pay.</p>
                  )}
                  {form.category === 'COMPASSIONATE_LEAVE' && (
                    <p className="mt-1 text-xs text-purple-600">Days deducted from your annual leave balance.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Start date</label>
                    <input type="date" name="start_date"
                      className={`input ${errors.start_date ? 'border-red-400' : ''}`}
                      value={form.start_date} onChange={handleChange} />
                    {errors.start_date && <p className="form-error">{errors.start_date}</p>}
                  </div>
                  <div>
                    <label className="form-label">End date</label>
                    <input type="date" name="end_date"
                      className={`input ${errors.end_date ? 'border-red-400' : ''}`}
                      value={form.end_date} onChange={handleChange} />
                    {errors.end_date && <p className="form-error">{errors.end_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Duty resume date</label>
                    <input type="date" name="duty_resume_date"
                      className={`input ${errors.duty_resume_date ? 'border-red-400' : ''}`}
                      value={form.duty_resume_date} onChange={handleChange} />
                    {errors.duty_resume_date && <p className="form-error">{errors.duty_resume_date}</p>}
                  </div>
                  <div>
                    <label className="form-label">Working days</label>
                    <input type="number" name="days_requested" min="0.5" step="0.5"
                      className={`input ${errors.days_requested ? 'border-red-400' : ''}`}
                      value={form.days_requested} onChange={handleChange} />
                    {errors.days_requested && <p className="form-error">{errors.days_requested}</p>}
                    <p className="mt-1 text-xs text-gray-400">Auto-calculated from dates (excl. weekends)</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea name="reason" rows={2} className="input resize-none"
                    placeholder="Brief reason for leave..."
                    value={form.reason} onChange={handleChange} />
                </div>

                {form.category === 'SICK_LEAVE' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="sick_certificate"
                      checked={form.sick_certificate} onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600" />
                    <span className="text-sm text-gray-700">
                      I confirm I have a medical certificate from a qualified practitioner
                    </span>
                  </label>
                )}

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 flex-shrink-0">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                  className="btn-secondary w-auto px-5">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary w-auto px-6">
                  {submitting
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Submitting...</>
                    : 'Submit request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Review modal ────────────────────────────────────────────────── */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {reviewing.action === 'APPROVED' ? 'Approve' : 'Reject'} leave
              </h2>
              <button onClick={() => setReviewing(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 space-y-1">
                <p className="font-medium">{reviewing.leave.employee_name}</p>
                <p>{catInfo(reviewing.leave.category)?.label} · {parseFloat(reviewing.leave.days_requested).toFixed(1)} days</p>
                <p>{fmt(reviewing.leave.start_date)} → {fmt(reviewing.leave.end_date)}</p>
              </div>
              <div>
                <label className="form-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea rows={3} className="input resize-none"
                  placeholder={reviewing.action === 'REJECTED' ? 'Reason for rejection...' : 'Any notes...'}
                  value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setReviewing(null)} className="btn-secondary w-auto px-5">Cancel</button>
              <button
                onClick={handleReview}
                className={`w-auto px-6 rounded-lg text-sm font-medium text-white py-2.5 transition
                  ${reviewing.action === 'APPROVED' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                Confirm {reviewing.action === 'APPROVED' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default LeavePage;