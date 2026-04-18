import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getFundsRequisitions, createFundsRequisition, submitFundsRequisition,
  supervisorApprove, financeApprove, rejectFundsRequisition, getFundsCategories,
} from '../../api/profile.api';

const STATUS_COLORS = {
  DRAFT:              'bg-gray-100   text-gray-600',
  PENDING_SUPERVISOR: 'bg-yellow-100 text-yellow-700',
  PENDING_FINANCE:    'bg-blue-100   text-blue-700',
  APPROVED:           'bg-green-100  text-green-700',
  REJECTED:           'bg-red-100    text-red-700',
};

const STATUS_LABELS = {
  DRAFT:              'Draft',
  PENDING_SUPERVISOR: 'Pending supervisor',
  PENDING_FINANCE:    'Pending finance',
  APPROVED:           'Approved',
  REJECTED:           'Rejected',
};

const STEPS = [
  { n: 1, label: 'Purpose'        },
  { n: 2, label: 'Requestor'      },
  { n: 3, label: 'Amount'         },
  { n: 4, label: 'Justification'  },
  { n: 5, label: 'Review'         },
];

const fmtKES = (n) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n);
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-KE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const EMPTY = {
  purpose: '', category: '', justification: '',
  amount_kes: '', amount_words: '', department: '',
};

const FundsPage = () => {
  const { user } = useAuth();
  const isSupervisor = ['SUPERVISOR','HEAD_OF_DEPARTMENT','ADMIN'].includes(user?.role);
  const isFinance    = ['HEAD_OF_DEPARTMENT','ADMIN','HUMAN_RESOURCES'].includes(user?.role);

  const [reqs,      setReqs]      = useState([]);
  const [categories,setCategories]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [step,      setStep]      = useState(1);
  const [form,      setForm]      = useState(EMPTY);
  const [errors,    setErrors]    = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('mine');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab === 'pending'
        ? { status: 'PENDING_SUPERVISOR' }
        : activeTab === 'finance'
        ? { status: 'PENDING_FINANCE' }
        : {};
      const [reqRes, catRes] = await Promise.all([
        getFundsRequisitions(params),
        getFundsCategories(),
      ]);
      setReqs(reqRes.data.requisitions);
      setCategories(catRes.data.categories);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  // Validate current step before advancing
  const validateStep = () => {
    const errs = {};
    if (step === 1) {
      if (!form.purpose.trim())  errs.purpose  = 'Purpose is required.';
      if (!form.category.trim()) errs.category = 'Category is required.';
    }
    if (step === 2) {
      if (!form.department.trim()) errs.department = 'Department is required.';
    }
    if (step === 3) {
      if (!form.amount_kes || isNaN(form.amount_kes) || Number(form.amount_kes) <= 0)
        errs.amount_kes = 'Enter a valid amount.';
      if (!form.amount_words.trim()) errs.amount_words = 'Amount in words is required.';
    }
    if (step === 4) {
      if (!form.justification.trim()) errs.justification = 'Justification is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createFundsRequisition(form);
      toast.success('Requisition saved as draft.');
      setShowForm(false);
      setStep(1);
      setForm(EMPTY);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create requisition.');
    } finally { setSubmitting(false); }
  };

  const handleSubmit = async (id) => {
    try {
      await submitFundsRequisition(id);
      toast.success('Submitted for supervisor approval.');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleSupervisorApprove = async (id) => {
    try {
      await supervisorApprove(id);
      toast.success('Approved and forwarded to finance.');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleFinanceApprove = async (id) => {
    try {
      await financeApprove(id);
      toast.success('Requisition fully approved.');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Reason required.'); return; }
    try {
      await rejectFundsRequisition(rejectModal, rejectReason);
      toast.success('Requisition rejected.');
      setRejectModal(null);
      setRejectReason('');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const tabs = [
    { key: 'mine',    label: 'My requisitions' },
    ...(isSupervisor ? [{ key: 'pending', label: 'Pending approval' }] : []),
    ...(isFinance    ? [{ key: 'finance', label: 'Pending finance'  }] : []),
  ];

  return (
    <AppLayout>
      <div className="page-container max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Funds Requisitions</h1>
            <p className="text-sm text-gray-500">{reqs.length} requisitions</p>
          </div>
          <button onClick={() => { setShowForm(true); setStep(1); setForm(EMPTY); setErrors({}); }}
            className="btn-primary w-auto px-5">
            + New requisition
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 sm:px-5 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition
                ${activeTab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)
          ) : reqs.length === 0 ? (
            <div className="card text-center py-10 text-sm text-gray-400">
              No requisitions found.
            </div>
          ) : reqs.map((r) => (
            <div key={r.requisition_id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-gray-500">
                      {r.requisition_number || 'DRAFT'}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                      {r.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">{r.purpose}</p>
                  <p className="text-lg font-bold text-gray-900">{fmtKES(r.amount_kes)}</p>
                  <div className="text-xs text-gray-400 space-y-0.5">
                    {r.requested_by_name !== user?.name && (
                      <p>By: {r.requested_by_name} · {r.department || '—'}</p>
                    )}
                    <p>Created: {fmtDate(r.created_at)}</p>
                    {r.supervisor_name && r.supervisor_signed_at && (
                      <p className="text-green-600">✓ Supervisor: {r.supervisor_name} · {fmtDate(r.supervisor_signed_at)}</p>
                    )}
                    {r.finance_name && r.finance_signed_at && (
                      <p className="text-green-600">✓ Finance: {r.finance_name} · {fmtDate(r.finance_signed_at)}</p>
                    )}
                    {r.rejection_reason && (
                      <p className="text-red-500">Rejected: {r.rejection_reason}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  {r.requested_by === user?.user_id && r.status === 'DRAFT' && (
                    <button onClick={() => handleSubmit(r.requisition_id)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
                      Submit
                    </button>
                  )}
                  {isSupervisor && r.status === 'PENDING_SUPERVISOR' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleSupervisorApprove(r.requisition_id)}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">
                        Approve
                      </button>
                      <button onClick={() => setRejectModal(r.requisition_id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                        Reject
                      </button>
                    </div>
                  )}
                  {isFinance && r.status === 'PENDING_FINANCE' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleFinanceApprove(r.requisition_id)}
                        className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600">
                        Final approve
                      </button>
                      <button onClick={() => setRejectModal(r.requisition_id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Multi-step create modal ─────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-xl max-h-[95vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 flex-shrink-0">
              <h2 className="text-base font-semibold text-gray-900">New funds requisition</h2>
              <button onClick={() => setShowForm(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
              {STEPS.map(({ n, label }, idx) => (
                <div key={n} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition
                      ${step > n  ? 'bg-green-500 text-white' :
                        step === n ? 'bg-brand-600 text-white' :
                                     'bg-gray-100 text-gray-400'}`}>
                      {step > n ? '✓' : n}
                    </div>
                    <span className={`mt-1 text-xs whitespace-nowrap
                      ${step === n ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 w-8 mx-1 mb-4 rounded ${step > n ? 'bg-green-400' : 'bg-gray-100'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

              {step === 1 && (
                <>
                  <div>
                    <label className="form-label">Category <span className="text-red-400">*</span></label>
                    <select name="category" className={`input ${errors.category ? 'border-red-400' : ''}`}
                      value={form.category} onChange={handleChange}>
                      <option value="">Select category...</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className="form-error">{errors.category}</p>}
                  </div>
                  <div>
                    <label className="form-label">Request purpose <span className="text-red-400">*</span></label>
                    <textarea name="purpose" rows={3} className={`input resize-none ${errors.purpose ? 'border-red-400' : ''}`}
                      placeholder="Describe what the funds are needed for..."
                      value={form.purpose} onChange={handleChange} />
                    {errors.purpose && <p className="form-error">{errors.purpose}</p>}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <p className="text-xs text-gray-400">{user?.role?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <label className="form-label">Department / Business unit <span className="text-red-400">*</span></label>
                    <input name="department" className={`input ${errors.department ? 'border-red-400' : ''}`}
                      placeholder="e.g. Operations, Finance, Technical"
                      value={form.department} onChange={handleChange} />
                    {errors.department && <p className="form-error">{errors.department}</p>}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="form-label">Amount (KES) <span className="text-red-400">*</span></label>
                    <input type="number" name="amount_kes" min="1" step="0.01"
                      className={`input text-lg font-semibold ${errors.amount_kes ? 'border-red-400' : ''}`}
                      placeholder="0.00"
                      value={form.amount_kes} onChange={handleChange} />
                    {errors.amount_kes && <p className="form-error">{errors.amount_kes}</p>}
                    {form.amount_kes && !isNaN(form.amount_kes) && (
                      <p className="mt-1 text-xs text-gray-500">{fmtKES(form.amount_kes)}</p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Amount in words <span className="text-red-400">*</span></label>
                    <input name="amount_words" className={`input ${errors.amount_words ? 'border-red-400' : ''}`}
                      placeholder="e.g. Kenya Shillings Fifty Thousand Only"
                      value={form.amount_words} onChange={handleChange} />
                    {errors.amount_words && <p className="form-error">{errors.amount_words}</p>}
                  </div>
                </>
              )}

              {step === 4 && (
                <div>
                  <label className="form-label">Supporting justification <span className="text-red-400">*</span></label>
                  <textarea name="justification" rows={5} className={`input resize-none ${errors.justification ? 'border-red-400' : ''}`}
                    placeholder="Provide detailed justification. Include budget breakdown, quotes, invoices referenced, or project approval details..."
                    value={form.justification} onChange={handleChange} />
                  {errors.justification && <p className="form-error">{errors.justification}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    Attach physical invoices/quotations when submitting the physical copy.
                  </p>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Review before saving</h3>
                  {[
                    { label: 'Category',     value: form.category },
                    { label: 'Purpose',      value: form.purpose },
                    { label: 'Requested by', value: user?.name },
                    { label: 'Department',   value: form.department },
                    { label: 'Amount',       value: fmtKES(form.amount_kes) },
                    { label: 'In words',     value: form.amount_words },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="text-gray-400 w-28 flex-shrink-0">{label}</span>
                      <span className="text-gray-800 text-right font-medium">{value}</span>
                    </div>
                  ))}
                  {form.justification && (
                    <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                      <p className="font-medium text-gray-500 mb-1">Justification</p>
                      {form.justification}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    This will be saved as a draft. You can review and submit for approval from the requisitions list.
                  </p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex justify-between border-t border-gray-100 px-6 py-4 flex-shrink-0">
              <button
                type="button"
                onClick={step === 1 ? () => setShowForm(false) : prevStep}
                className="btn-secondary w-auto px-5">
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 5 ? (
                <button onClick={nextStep} className="btn-primary w-auto px-6">
                  Next →
                </button>
              ) : (
                <button onClick={handleCreate} disabled={submitting} className="btn-primary w-auto px-6">
                  {submitting
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                    : 'Save as draft'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject modal ────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Reject requisition</h2>
              <button onClick={() => setRejectModal(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              <label className="form-label">Reason for rejection <span className="text-red-400">*</span></label>
              <textarea rows={3} className="input resize-none"
                placeholder="Explain why this requisition is being rejected..."
                value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setRejectModal(null)} className="btn-secondary w-auto px-5">Cancel</button>
              <button onClick={handleReject}
                className="rounded-lg bg-red-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600">
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default FundsPage;