import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getCustomers, getDevicesByCustomer, createTicket } from '../../api/tickets.api';

const TICKET_TYPES = ['REPAIR', 'DIAGNOSTIC', 'WARRANTY', 'UPGRADE', 'OTHER'];

const CreateTicketModal = ({ onClose, onCreated }) => {
  const [step, setStep]           = useState(1); // 1=customer, 2=device, 3=details
  const [customers, setCustomers] = useState([]);
  const [devices,   setDevices]   = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitting,setSubmitting]= useState(false);

  const [selected, setSelected] = useState({
    customer: null,
    device:   null,
    ticket_type: 'REPAIR',
    notes: '',
  });

  // Load customers on search
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getCustomers({ search, limit: 10 });
        if (active) setCustomers(data.customers);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    };
    const timer = setTimeout(load, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);

  // Load devices when customer selected
  useEffect(() => {
    if (!selected.customer) return;
    getDevicesByCustomer(selected.customer.customer_id)
      .then(({ data }) => setDevices(data.devices))
      .catch(() => setDevices([]));
  }, [selected.customer]);

  const handleSubmit = async () => {
    if (!selected.customer) { toast.error('Select a customer.'); return; }
    setSubmitting(true);
    try {
      const { data } = await createTicket({
        customer_id:  selected.customer.customer_id,
        device_id:    selected.device?.device_id || null,
        ticket_type:  selected.ticket_type,
        notes:        selected.notes,
      });

      if (data.warning) {
        toast(`⚠️ ${data.warning}`, { duration: 6000 });
      }
      toast.success('Ticket created!');
      onCreated(data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">New ticket</h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex border-b border-gray-100 px-6 py-3 gap-6">
          {[
            { n: 1, label: 'Customer' },
            { n: 2, label: 'Device' },
            { n: 3, label: 'Details' },
          ].map(({ n, label }) => (
            <button
              key={n}
              onClick={() => n < step && setStep(n)}
              className="flex items-center gap-2"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                ${step === n ? 'bg-brand-600 text-white' :
                  step >  n ? 'bg-green-500 text-white' :
                               'bg-gray-100 text-gray-400'}`}>
                {step > n ? '✓' : n}
              </span>
              <span className={`text-sm ${step === n ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">

          {/* Step 1: Select customer */}
          {step === 1 && (
            <>
              <input
                className="input"
                placeholder="Search customer by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {loading && (
                  <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
                )}
                {!loading && customers.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-400">No customers found.</div>
                )}
                {customers.map((c) => (
                  <button
                    key={c.customer_id}
                    onClick={() => { setSelected((p) => ({ ...p, customer: c, device: null })); setStep(2); }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone || c.email || '—'}</p>
                    </div>
                    <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Select device */}
          {step === 2 && (
            <>
              <div className="rounded-lg bg-brand-50 border border-brand-100 px-4 py-2 text-sm text-brand-700">
                Customer: <span className="font-semibold">{selected.customer?.name}</span>
                <button onClick={() => setStep(1)} className="ml-2 text-xs underline">Change</button>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {devices.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-400">No devices registered for this customer.</div>
                )}
                {devices.map((d) => (
                  <button
                    key={d.device_id}
                    onClick={() => { setSelected((p) => ({ ...p, device: d })); setStep(3); }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition
                      ${selected.device?.device_id === d.device_id ? 'bg-brand-50' : ''}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.brand} {d.model}</p>
                      <p className="text-xs text-gray-400">S/N: {d.serial_number || '—'} · {d.device_type || '—'}</p>
                    </div>
                    {selected.device?.device_id === d.device_id && (
                      <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Skip — no device selected
              </button>
            </>
          )}

          {/* Step 3: Ticket details */}
          {step === 3 && (
            <>
              <div className="rounded-lg bg-brand-50 border border-brand-100 px-4 py-2 text-sm space-y-0.5">
                <p className="text-brand-700">Customer: <span className="font-semibold">{selected.customer?.name}</span></p>
                {selected.device && (
                  <p className="text-brand-600 text-xs">{selected.device.brand} {selected.device.model} · S/N: {selected.device.serial_number || '—'}</p>
                )}
              </div>

              <div>
                <label className="form-label">Ticket type</label>
                <select
                  className="input"
                  value={selected.ticket_type}
                  onChange={(e) => setSelected((p) => ({ ...p, ticket_type: e.target.value }))}
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe the issue..."
                  value={selected.notes}
                  onChange={(e) => setSelected((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-between border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="btn-secondary w-auto px-5">Cancel</button>
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn-secondary w-auto px-5">Back</button>
            )}
            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={submitting || !selected.customer}
                className="btn-primary w-auto px-6"
              >
                {submitting ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating...</>
                ) : 'Create ticket'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateTicketModal;