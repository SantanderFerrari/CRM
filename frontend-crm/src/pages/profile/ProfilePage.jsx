import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppLayout   from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { updateMyProfile, changeMyPassword, getLeaveBalance } from '../../api/profile.api';
import { useEffect } from 'react';

const ROLE_COLORS = {
  ADMIN:               'bg-purple-100 text-purple-700',
  SUPERVISOR:          'bg-blue-100   text-blue-700',
  TECHNICIAN:          'bg-green-100  text-green-700',
  CUSTOMER_CARE:       'bg-yellow-100 text-yellow-700',
  SALES_REPRESENTATIVE:'bg-orange-100 text-orange-700',
  HEAD_OF_DEPARTMENT:  'bg-red-100    text-red-700',
  HUMAN_RESOURCES:     'bg-pink-100   text-pink-700',
};

const initials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [balance,   setBalance]   = useState(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passForm, setPassForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [passErrors,  setPassErrors]  = useState({});
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    getLeaveBalance()
      .then(({ data }) => setBalance(data.balance))
      .catch(() => {});
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateMyProfile({ ...profileForm, user_id: user.user_id });
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passForm.currentPassword) errs.currentPassword = 'Required.';
    if (passForm.newPassword.length < 8) errs.newPassword = 'Min 8 characters.';
    if (!/[A-Z]/.test(passForm.newPassword)) errs.newPassword = 'Must contain uppercase.';
    if (!/[0-9]/.test(passForm.newPassword)) errs.newPassword = 'Must contain a number.';
    if (passForm.newPassword !== passForm.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errs).length) { setPassErrors(errs); return; }

    setPassLoading(true);
    try {
      await changeMyPassword({
        currentPassword: passForm.currentPassword,
        newPassword:     passForm.newPassword,
      });
      toast.success('Password changed. Please log in again.');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassErrors({ currentPassword: err.response?.data?.message || 'Incorrect password.' });
    } finally {
      setPassLoading(false);
    }
  };

  const TABS = ['info', 'security', 'leave'];

  return (
    <AppLayout>
      <div className="page-container max-w-3xl">

        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center
                            rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {initials(user?.name)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{user?.name}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium
                ${ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 capitalize transition
                ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'info' ? 'Personal info' : tab === 'security' ? 'Security' : 'Leave balance'}
            </button>
          ))}
        </div>

        {/* Tab: Personal Info */}
        {activeTab === 'info' && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Personal information</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="form-label">Full name</label>
                <input className="input" value={profileForm.name}
                  onChange={(e) => setProfileForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="input" value={profileForm.email}
                    onChange={(e) => setProfileForm(p => ({...p, email: e.target.value}))} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="input" value={profileForm.phone}
                    placeholder="+254712345678"
                    onChange={(e) => setProfileForm(p => ({...p, phone: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="form-label">Role</label>
                <input className="input bg-gray-50 cursor-not-allowed"
                  value={user?.role?.replace(/_/g, ' ')} disabled />
                <p className="mt-1 text-xs text-gray-400">Role can only be changed by an admin.</p>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={profileLoading} className="btn-primary w-auto px-6">
                  {profileLoading
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving...</>
                    : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Security */}
        {activeTab === 'security' && (
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Change password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="form-label">Current password</label>
                <input type="password" className={`input ${passErrors.currentPassword ? 'border-red-400' : ''}`}
                  value={passForm.currentPassword}
                  onChange={(e) => { setPassForm(p => ({...p, currentPassword: e.target.value})); setPassErrors({}); }} />
                {passErrors.currentPassword && <p className="form-error">{passErrors.currentPassword}</p>}
              </div>
              <div>
                <label className="form-label">New password</label>
                <input type="password" className={`input ${passErrors.newPassword ? 'border-red-400' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={passForm.newPassword}
                  onChange={(e) => { setPassForm(p => ({...p, newPassword: e.target.value})); setPassErrors({}); }} />
                {passErrors.newPassword && <p className="form-error">{passErrors.newPassword}</p>}
              </div>
              <div>
                <label className="form-label">Confirm new password</label>
                <input type="password" className={`input ${passErrors.confirmPassword ? 'border-red-400' : ''}`}
                  value={passForm.confirmPassword}
                  onChange={(e) => { setPassForm(p => ({...p, confirmPassword: e.target.value})); setPassErrors({}); }} />
                {passErrors.confirmPassword && <p className="form-error">{passErrors.confirmPassword}</p>}
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={passLoading} className="btn-primary w-auto px-6">
                  {passLoading ? 'Updating...' : 'Change password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Leave balance */}
        {activeTab === 'leave' && (
          <div className="space-y-4">
            {balance ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Accrued',    value: balance.accrued_days,    color: 'blue'   },
                    { label: 'Used',       value: balance.used_days,       color: 'orange' },
                    { label: 'Carried fwd',value: balance.carried_forward, color: 'purple' },
                    { label: 'Available',  value: balance.available_days,  color: 'green'  },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl border p-4 text-center
                      ${color === 'green'  ? 'bg-green-50  border-green-200' :
                        color === 'blue'   ? 'bg-blue-50   border-blue-200'  :
                        color === 'orange' ? 'bg-orange-50 border-orange-200':
                                            'bg-purple-50 border-purple-200'}`}>
                      <p className={`text-2xl font-bold
                        ${color === 'green'  ? 'text-green-700'  :
                          color === 'blue'   ? 'text-blue-700'   :
                          color === 'orange' ? 'text-orange-700' :
                                              'text-purple-700'}`}>
                        {parseFloat(value).toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{label} days</p>
                    </div>
                  ))}
                </div>
                <div className="card text-sm text-gray-600 space-y-2">
                  <p className="font-medium text-gray-700">Leave policy summary</p>
                  <p>• Accrual rate: <span className="font-medium">1.75 days/month</span> (21 days/year)</p>
                  <p>• Unused days can be carried forward and must be taken within <span className="font-medium">18 months</span></p>
                  <p>• Sick leave: first 7 days full pay, next 7 days half pay (requires medical certificate)</p>
                  <p>• Maternity: 90 calendar days full pay · Paternity: 14 calendar days full pay</p>
                </div>
              </>
            ) : (
              <div className="card text-center py-8 text-gray-400 text-sm">Loading balance...</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => navigate('/leave')} className="btn-primary w-auto px-5">
                Request leave
              </button>
              <button onClick={() => navigate('/leave')} className="btn-secondary w-auto px-5">
                View my requests
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

export default ProfilePage;