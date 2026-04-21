import { useState } from 'react';
import toast from 'react-hot-toast';
import { createDevice, updateDevice } from '../../api/customers.api';

const DEVICE_TYPES = ['ETR', 'ESD', 'Thermal Printer', 'All in one Desktop', 'Printer', 'Android POS', 'Tablet', 'Cash Register', 'Barcode Scanner', 'Other'];
const EMPTY = { serial_number: '', brand: '', model: '', device_type: 'Comstore Smart VSCU' };

const DeviceFormModal = ({ device, customerId, customerName, onClose, onSaved }) => {
  const isEdit = Boolean(device);
  const [form,   setForm]   = useState(isEdit ? {
    serial_number: device.serial_number || '',
    brand:         device.brand         || '',
    model:         device.model         || '',
    device_type:   device.device_type   || 'Comstore Smart VSCU',
  } : EMPTY);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = isEdit ? form : { ...form, customer_id: customerId };
      const { data } = isEdit
        ? await updateDevice(device.device_id, payload)
        : await createDevice(payload);
      toast.success(isEdit ? 'Device updated.' : 'Device registered.');
      onSaved(isEdit ? data.device : data.device);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save device.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {isEdit ? 'Edit device' : 'Register device'}
            </h2>
            {customerName && (
              <p className="text-xs text-gray-400 mt-0.5">For: {customerName}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">

            <div>
              <label className="form-label">Device type</label>
              <select name="device_type" className="input" value={form.device_type} onChange={handleChange}>
                {DEVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Brand</label>
                <input name="brand" className="input" placeholder="Comstore..."
                  value={form.brand} onChange={handleChange} autoFocus />
              </div>
              <div>
                <label className="form-label">Model</label>
                <input name="model" className="input" placeholder="FC4..."
                  value={form.model} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="form-label">Serial number</label>
              <input name="serial_number" className={`input ${errors.serial_number ? 'border-red-400' : ''}`}
                placeholder="KRAMW0170000000001" value={form.serial_number} onChange={handleChange} />
              {errors.serial_number && <p className="form-error">{errors.serial_number}</p>}
            </div>

          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose} className="btn-secondary w-auto px-5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary w-auto px-6">
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                : isEdit ? 'Save changes' : 'Register device'
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default DeviceFormModal;