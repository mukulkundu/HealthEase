import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import { authApi } from "./api/auth.api";
import type { Role } from "./types";

// Ensure /auth/me is only called once per app load (avoids Strict Mode double-call and re-run loops)
let initialAuthCheckDone = false;

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import DoctorListPage from "./pages/public/DoctorListPage";
import DoctorProfilePage from "./pages/public/DoctorProfilePage";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointmentPage from "./pages/patient/BookAppointmentPage";
import MyAppointmentsPage from "./pages/patient/MyAppointmentsPage";

// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import ManageSchedulePage from "./pages/doctor/ManageSchedulePage";
import DoctorAppointmentsPage from "./pages/doctor/DoctorAppointmentsPage";

// Layout
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { Loader2 } from "lucide-react";

function AppContent() {
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (initialAuthCheckDone) {
      useAuthStore.getState().setLoading(false);
      return;
    }
    initialAuthCheckDone = true;

    const { setAuth, clearAuth, setLoading } = useAuthStore.getState();
    authApi
      .me()
      .then((res) => {
        if (res.data) setAuth(res.data);
      })
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, []); // Run once on mount; store actions from getState() are stable

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/doctors" element={<DoctorListPage />} />
        <Route path="/doctors/:id" element={<DoctorProfilePage />} />

        {/* Auth */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Patient routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/book/:doctorId" element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <BookAppointmentPage />
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <MyAppointmentsPage />
          </ProtectedRoute>
        } />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor/schedule" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <ManageSchedulePage />
          </ProtectedRoute>
        } />
        <Route path="/doctor/appointments" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorAppointmentsPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

// Redirect logged-in users away from auth pages
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <>{children}</>;
}

function getRoleHome(role: Role): string {
  switch (role) {
    case "DOCTOR": return "/doctor/dashboard";
    case "ADMIN": return "/admin";
    default: return "/dashboard";
  }
}

export default App;