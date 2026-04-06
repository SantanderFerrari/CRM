import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import LoginPage       from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage   from './pages/DashboardPage';
import TicketsPage    from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketsDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import JobCardsPage from './pages/jobcards/JobCardsPage';
import JobCardDetailPage from './pages/jobcards/JobCardDetailPage';
import UsersPage from './pages/users/UsersPage';
import UnauthorizedPage from './pages/UnauthorizedPage';


const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px' },
          success: { iconTheme: { primary: '#e90808', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Protected — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />  
          <Route path="/jobcards" element={<JobCardsPage />} />
          <Route path="/jobcards/:id" element={<JobCardDetailPage />} />

        </Route>

        {/* Protected — Admin + Supervisor only (example) */}
        <Route element={<ProtectedRoute roles={['ADMIN', 'SUPERVISOR', 'HEAD_OF_DEPARTMENT']} />}>
          {/* <Route path="/users" element={<UsersPage />} /> */}
          <Route path="/users" element={<UsersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

    </AuthProvider>
  </BrowserRouter>
);

export default App;