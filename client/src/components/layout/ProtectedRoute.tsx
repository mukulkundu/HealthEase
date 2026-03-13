import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import type { Role } from "../../types";

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own home if they land on the wrong role's route
    switch (user.role) {
      case "DOCTOR": return <Navigate to="/doctor/dashboard" replace />;
      case "ADMIN": return <Navigate to="/admin" replace />;
      default: return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}