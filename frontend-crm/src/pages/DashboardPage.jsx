import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {user?.name} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-700">
          Role: <span className="text-black-800 font-medium">{user?.role}</span>
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-400">
          Dashboard coming soon
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;