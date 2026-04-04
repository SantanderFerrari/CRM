import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { forgotPasswordRequest, resetPasswordRequest } from '../../api/auth.api';

// ── Step indicator ─────────────────────────────────────────────────────────
const Step = ({ number, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition
      ${done  ? 'bg-green-500 text-white' :
        active ? 'bg-brand-600 text-white' :
                 'bg-gray-200 text-gray-500'}`}>
      {done ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : number}
    </div>
    <span className={`text-sm ${active ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────
const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // step: 'request' | 'reset'
  const [step,    setStep]    = useState('request');
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // Step 1 fields
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');

  // Step 2 fields
  const [otp,         setOtp]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // ── Step 1: request OTP ──────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!identifier.trim()) {
      setErrors({ identifier: `${method === 'email' ? 'Email' : 'Phone number'} is required.` });
      return;
    }

    setLoading(true);
    try {
      const payload = method === 'email'
        ? { email: identifier.trim() }
        : { phone: identifier.trim() };

      await forgotPasswordRequest(payload);
      toast.success('OTP sent! Check your ' + (method === 'email' ? 'inbox' : 'phone') + '.');
      setStep('reset');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        setErrors({ general: err.response?.data?.message || 'Something went wrong.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP + reset password ──────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (newPassword !== confirmPass) {
      setErrors({ confirmPass: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        otp,
        newPassword,
        ...(method === 'email' ? { email: identifier } : { phone: identifier }),
      };

      const { data } = await resetPasswordRequest(payload);
      toast.success(data.message || 'Password reset successfully!');
      navigate('/login', { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        const mapped = {};
        apiErrors.forEach(({ field, message }) => { mapped[field] = message; });
        setErrors(mapped);
      } else {
        setErrors({ general: err.response?.data?.message || 'Invalid or expired OTP.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
          <p className="mt-1 text-sm text-gray-500">We'll send a 6-digit OTP to verify it's you</p>
        </div>

        {/* Step indicators */}
        <div className="mb-6 flex items-center justify-center gap-6">
          <Step number="1" label="Verify identity" active={step === 'request'} done={step === 'reset'} />
          <div className="h-px w-8 bg-gray-200" />
          <Step number="2" label="New password"    active={step === 'reset'}   done={false} />
        </div>

        <div className="card">

          {/* ── STEP 1: Request OTP ─────────────────────────────────── */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} noValidate className="space-y-5">

              {errors.general && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {errors.general}
                </div>
              )}

              {/* Method toggle */}
              <div>
                <label className="form-label">Send OTP via</label>
                <div className="flex gap-3">
                  {['email', 'phone'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMethod(m); setIdentifier(''); setErrors({}); }}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium transition
                        ${method === m
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {m === 'email' ? 'Email' : 'Phone number'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Identifier input */}
              <div>
                <label className="form-label" htmlFor="identifier">
                  {method === 'email' ? 'Email address' : 'Phone number'}
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type={method === 'email' ? 'email' : 'tel'}
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setErrors({}); }}
                  placeholder={method === 'email' ? 'you@example.com' : '+254712345678'}
                  className={`input ${errors.identifier ? 'border-red-400' : ''}`}
                />
                {errors.identifier && <p className="form-error">{errors.identifier}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending OTP...</>
                ) : 'Send OTP'}
              </button>

            </form>
          )}

          {/* ── STEP 2: Verify OTP + new password ───────────────────── */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} noValidate className="space-y-5">

              {errors.general && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {errors.general}
                </div>
              )}

              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                OTP sent to <span className="font-medium">{identifier}</span>.
                <button type="button" onClick={() => { setStep('request'); setOtp(''); setErrors({}); }}
                  className="ml-2 underline hover:no-underline">
                  Change
                </button>
              </div>

              {/* OTP */}
              <div>
                <label className="form-label" htmlFor="otp">6-digit OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErrors({}); }}
                  placeholder="123456"
                  className={`input tracking-widest text-center text-lg font-semibold ${errors.otp ? 'border-red-400' : ''}`}
                />
                {errors.otp && <p className="form-error">{errors.otp}</p>}
              </div>

              {/* New password */}
              <div>
                <label className="form-label" htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  className={`input ${errors.newPassword ? 'border-red-400' : ''}`}
                />
                {errors.newPassword && <p className="form-error">{errors.newPassword}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="form-label" htmlFor="confirmPass">Confirm password</label>
                <input
                  id="confirmPass"
                  name="confirmPass"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => { setConfirmPass(e.target.value); setErrors({}); }}
                  placeholder="Re-enter new password"
                  className={`input ${errors.confirmPass ? 'border-red-400' : ''}`}
                />
                {errors.confirmPass && <p className="form-error">{errors.confirmPass}</p>}
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary">
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Resetting...</>
                ) : 'Reset password'}
              </button>

            </form>
          )}

        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;