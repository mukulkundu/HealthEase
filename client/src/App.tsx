import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import { authApi } from "./api/auth.api";
import { useSocket } from "./hooks/useSocket";
import type { Role } from "./types";

// Ensure /auth/me is only called once per app load (avoids Strict Mode double-call and re-run loops)
let initialAuthCheckDone = false;

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import DoctorListPage from "./pages/public/DoctorListPage";
import PublicDoctorProfilePage from "./pages/public/DoctorProfilePage";

// Patient pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfilePage from "./pages/patient/PatientProfilePage";
import BookAppointmentPage from "./pages/patient/BookAppointmentPage";
import MyAppointmentsPage from "./pages/patient/MyAppointmentsPage";

// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import SetupProfilePage from "./pages/doctor/SetupProfilePage";
import DoctorProfilePage from "./pages/doctor/DoctorProfilePage";
import ManageSchedulePage from "./pages/doctor/ManageSchedulePage";
import DoctorAppointmentsPage from "./pages/doctor/DoctorAppointmentsPage";
import EarningsPage from "./pages/doctor/EarningsPage";
import PatientHistoryPage from "./pages/doctor/PatientHistoryPage";

// Chat pages
import ConversationsPage from "./pages/chat/ConversationsPage";
import ChatPage from "./pages/chat/ChatPage";

// Hospital public pages
import HospitalListPage from "./pages/public/HospitalListPage";
import HospitalProfilePage from "./pages/public/HospitalProfilePage";

// Hospital admin pages
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import SetupHospitalPage from "./pages/hospital/SetupHospitalPage";
import ManageDepartmentsPage from "./pages/hospital/ManageDepartmentsPage";
import ManageStaffPage from "./pages/hospital/ManageStaffPage";
import HospitalAppointmentsPage from "./pages/hospital/HospitalAppointmentsPage";

// Receptionist pages
import ReceptionDashboard from "./pages/hospital/ReceptionDashboard";

// Doctor hospital pages
import MyHospitalsPage from "./pages/doctor/MyHospitalsPage";
import DoctorHospitalAppointmentsPage from "./pages/doctor/DoctorHospitalAppointmentsPage";

// Patient hospital pages
import MyHospitalAppointmentsPage from "./pages/patient/MyHospitalAppointmentsPage";
import HospitalBookingPage from "./pages/patient/HospitalBookingPage";

// Layout
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { Loader2 } from "lucide-react";

function AppContent() {
  const isLoading = useAuthStore((s) => s.isLoading);
  useSocket();

  useEffect(() => {
    if (initialAuthCheckDone) {
      useAuthStore.getState().setLoading(false);
      return;
    }
    initialAuthCheckDone = true;

    const { setAuth, clearAuth, setLoading } = useAuthStore.getState();
    authApi
      .me()
      .then((user) => {
        if (user) setAuth(user);
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
        <Route path="/doctors/:id" element={<PublicDoctorProfilePage />} />
        <Route path="/hospitals" element={<HospitalListPage />} />
        <Route path="/hospitals/:id" element={<HospitalProfilePage />} />

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
        <Route path="/patient/profile" element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <PatientProfilePage />
          </ProtectedRoute>
        } />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor/setup-profile" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <SetupProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/doctor/profile" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorProfilePage />
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
        <Route path="/doctor/earnings" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <EarningsPage />
          </ProtectedRoute>
        } />
        <Route path="/doctor/patients/:patientId/history" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <PatientHistoryPage />
          </ProtectedRoute>
        } />

        {/* Patient hospital routes */}
        <Route path="/hospital-appointments" element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <MyHospitalAppointmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/hospitals/:hospitalId/book/:doctorId/:departmentId" element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <HospitalBookingPage />
          </ProtectedRoute>
        } />

        {/* Hospital admin routes */}
        <Route path="/hospital/dashboard" element={
          <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}>
            <HospitalDashboard />
          </ProtectedRoute>
        } />
        <Route path="/hospital/setup" element={
          <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}>
            <SetupHospitalPage />
          </ProtectedRoute>
        } />
        <Route path="/hospital/departments" element={
          <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}>
            <ManageDepartmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/hospital/staff" element={
          <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}>
            <ManageStaffPage />
          </ProtectedRoute>
        } />
        <Route path="/hospital/appointments" element={
          <ProtectedRoute allowedRoles={["HOSPITAL_ADMIN"]}>
            <HospitalAppointmentsPage />
          </ProtectedRoute>
        } />

        {/* Receptionist routes */}
        <Route path="/hospital/reception" element={
          <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
            <ReceptionDashboard />
          </ProtectedRoute>
        } />
        <Route path="/hospital/reception/appointments" element={
          <ProtectedRoute allowedRoles={["RECEPTIONIST"]}>
            <HospitalAppointmentsPage />
          </ProtectedRoute>
        } />

        {/* Doctor hospital routes */}
        <Route path="/doctor/hospitals" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <MyHospitalsPage />
          </ProtectedRoute>
        } />
        <Route path="/doctor/hospital-appointments" element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorHospitalAppointmentsPage />
          </ProtectedRoute>
        } />

        {/* Chat routes — both PATIENT and DOCTOR */}
        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={["PATIENT", "DOCTOR"]}>
            <ConversationsPage />
          </ProtectedRoute>
        } />
        <Route path="/chat/:appointmentId" element={
          <ProtectedRoute allowedRoles={["PATIENT", "DOCTOR"]}>
            <ChatPage />
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
    case "HOSPITAL_ADMIN": return "/hospital/dashboard";
    case "RECEPTIONIST": return "/hospital/reception";
    default: return "/dashboard";
  }
}

export default App;