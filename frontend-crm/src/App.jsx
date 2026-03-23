import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage       from './pages/auth/LoginPage';
import DashboardPage   from './pages/DashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px' },
          success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Protected — Admin + Supervisor only (example) */}
        <Route element={<ProtectedRoute roles={['ADMIN', 'SUPERVISOR', 'HEAD_OF_DEPARTMENT']} />}>
          {/* <Route path="/users" element={<UsersPage />} /> */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

    </AuthProvider>
  </BrowserRouter>
);

export default App;