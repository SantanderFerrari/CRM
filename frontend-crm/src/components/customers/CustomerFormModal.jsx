import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createCustomer, updateCustomer } from '../../api/customers.api';

const EMPTY = { name: '', phone: '', email: '', address: '' };

const CustomerFormModal = ({ customer, onClose, onSaved }) => {
  const isEdit = Boolean(customer);
  const [form,    setForm]    = useState(isEdit ? {
    name:    customer.name    || '',
    phone:   customer.phone   || '',
    email:   customer.email   || '',
    address: customer.address || '',
  } : EMPTY);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = isEdit
        ? await updateCustomer(customer.customer_id, form)
        : await createCustomer(form);
      toast.success(isEdit ? 'Customer updated.' : 'Customer created.');
      onSaved(isEdit ? data.customer : data.customer);
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save customer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit customer' : 'New customer'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">

            <div>
              <label className="form-label">Full name <span className="text-red-400">*</span></label>
              <input name="name" className={`input ${errors.name ? 'border-red-400' : ''}`}
                placeholder="Jane Mwangi" value={form.name} onChange={handleChange} autoFocus />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Phone</label>
                <input name="phone" className={`input ${errors.phone ? 'border-red-400' : ''}`}
                  placeholder="+254712345678" value={form.phone} onChange={handleChange} />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
              <div>
                <label className="form-label">Email</label>
                <input name="email" type="email" className={`input ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="jane@example.com" value={form.email} onChange={handleChange} />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Address</label>
              <textarea name="address" className="input resize-none" rows={2}
                placeholder="Westlands, Nairobi" value={form.address} onChange={handleChange} />
            </div>

          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose} className="btn-secondary w-auto px-5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary w-auto px-6">
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                : isEdit ? 'Save changes' : 'Create customer'
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CustomerFormModal;