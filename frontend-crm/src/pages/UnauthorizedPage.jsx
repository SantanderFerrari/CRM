import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="text-6xl font-bold text-gray-200">403</div>
      <h1 className="text-xl font-semibold text-gray-700">Access Denied</h1>
      <p className="text-sm text-gray-500">You don't have permission to view this page.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary mt-2 w-auto px-6">
        Go back
      </button>
    </div>
  );
};

export default UnauthorizedPage;