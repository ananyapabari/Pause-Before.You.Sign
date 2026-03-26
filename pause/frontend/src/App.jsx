import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import NewOfferPage from "./pages/NewOfferPage";
import ResultPage from "./pages/ResultPage";
import ReportScamPage from "./pages/ReportScamPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/AdminDashboard";
import RuleManagement from "./pages/RuleManagement";
import AuditLogs from "./pages/AuditLogs";
import UsersManagement from "./pages/UsersManagement";
import FlaggedOffers from "./pages/FlaggedOffers";
import AdminScamReportsPage from "./pages/AdminScamReportsPage";

const getStoredUser = () => {
  const raw = localStorage.getItem("pause_user");
  return raw ? JSON.parse(raw) : null;
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("pause_token");
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const user = getStoredUser();
  return user?.role === "admin" ? children : <Navigate to="/dashboard" replace />;
};

const UserOnlyRoute = ({ children }) => {
  const user = getStoredUser();
  return user?.role === "admin" ? <Navigate to="/admin" replace /> : children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserOnlyRoute>
              <DashboardPage />
            </UserOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-check"
        element={
          <ProtectedRoute>
            <UserOnlyRoute>
              <NewOfferPage />
            </UserOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/result"
        element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-scam"
        element={
          <ProtectedRoute>
            <UserOnlyRoute>
              <ReportScamPage />
            </UserOnlyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/rules"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <RuleManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AuditLogs />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <UsersManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/flagged-offers"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <FlaggedOffers />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/scam-reports"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminScamReportsPage />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
