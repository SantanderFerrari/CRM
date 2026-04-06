import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateUser, registerUser } from '../../api/users.api';

const ROLES = [
  'CUSTOMER_CARE','TECHNICIAN','SUPERVISOR',
  'SALES_REPRESENTATIVE','HEAD_OF_DEPARTMENT','HUMAN_RESOURCES','ADMIN',
];

const ROLE_LABELS = {
  CUSTOMER_CARE:       'Customer Care',
  TECHNICIAN:          'Technician',
  SUPERVISOR:          'Supervisor',
  SALES_REPRESENTATIVE:'Sales Representative',
  HEAD_OF_DEPARTMENT:  'Head of Department',
  HUMAN_RESOURCES:     'Human Resources',
  ADMIN:               'Admin',
};

const UserFormModal = ({ user, onClose, onSaved }) => {
  const isEdit = Boolean(user);
  const [form,   setForm]   = useState({
    name:     user?.name     || '',
    email:    user?.email    || '',
    role:     user?.role     || 'TECHNICIAN',
    phone:    user?.phone    || '',
    password: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!isEdit && !form.password) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.phone) payload.phone = form.phone;
        const { data } = await updateUser(user.user_id, payload);
        toast.success('User updated.');
        onSaved(data.user);
      } else {
        const { data } = await registerUser({
          name: form.name, email: form.email,
          role: form.role, password: form.password,
        });
        toast.success('User created.');
        onSaved(data.user);
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        toast.error(err.response?.data?.message || 'Failed to save user.');
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
            {isEdit ? 'Edit user' : 'New user'}
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
                placeholder="John Kamau" value={form.name} onChange={handleChange} autoFocus />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Email <span className="text-red-400">*</span></label>
                <input name="email" type="email"
                  className={`input ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="john@example.com" value={form.email} onChange={handleChange} />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input name="phone" className="input"
                  placeholder="+254712345678" value={form.phone} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="form-label">Role</label>
              <select name="role" className="input" value={form.role} onChange={handleChange}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            {!isEdit && (
              <div>
                <label className="form-label">Password <span className="text-red-400">*</span></label>
                <input name="password" type="password"
                  className={`input ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password} onChange={handleChange} />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
            )}

          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button type="button" onClick={onClose} className="btn-secondary w-auto px-5">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary w-auto px-6">
              {loading
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                : isEdit ? 'Save changes' : 'Create user'
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UserFormModal;