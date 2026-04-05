import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ROLE_BADGE_COLORS = {
  ADMIN:              'bg-purple-100 text-purple-700',
  SUPERVISOR:         'bg-blue-100 text-blue-700',
  TECHNICIAN:         'bg-green-100 text-green-700',
  CUSTOMER_CARE:      'bg-yellow-100 text-yellow-700',
  SALES_REPRESENTATIVE:'bg-orange-100 text-orange-700',
  HEAD_OF_DEPARTMENT: 'bg-red-100 text-red-700',
  HUMAN_RESOURCES:    'bg-pink-100 text-pink-700',
};

// Nav items with role visibility
const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',  roles: null }, // null = all roles
  { to: '/tickets',    label: 'Tickets',    roles: null },
  { to: '/customers',  label: 'Customers',  roles: ['ADMIN', 'CUSTOMER_CARE', 'SUPERVISOR'] },
  { to: '/devices',    label: 'Devices',    roles: ['ADMIN', 'CUSTOMER_CARE', 'SUPERVISOR', 'TECHNICIAN'] },
  { to: '/users',      label: 'Users',      roles: ['ADMIN', 'SUPERVISOR', 'HEAD_OF_DEPARTMENT'] },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out.');
    navigate('/login', { replace: true });
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="flex w-65 flex-col border-r border-gray-200 bg-white">

        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Comstore CRM Portal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition
                 ${isActive
                   ? 'bg-brand-50 text-brand-700'
                   : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center
                            rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
              <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium
                               ${ROLE_BADGE_COLORS[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex-shrink-0 rounded-md p-1.5 text-gray-400
                         hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
};

export default AppLayout;