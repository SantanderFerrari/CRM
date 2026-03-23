import { useState } from 'react';

/**
 * Lightweight form hook.
 *
 * const { values, errors, loading, handleChange, handleSubmit, setErrors } = useForm(
 *   { email: '', password: '' },
 *   async (values) => { await login(values); }
 * );
 */
const useForm = (initialValues, onSubmit) => {
  const [values,  setValues]  = useState(initialValues);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await onSubmit(values);
    } catch (err) {
      // Parse validation errors array from API
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        // Single message error (401, 403, etc.)
        setErrors({ general: err.response?.data?.message || 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return { values, errors, loading, handleChange, handleSubmit, setErrors };
};

export default useForm;