import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Loader2 } from "lucide-react";
import type { Role } from "../../types";

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "DOCTOR": return <Navigate to="/doctor/dashboard" replace />;
      case "ADMIN": return <Navigate to="/admin" replace />;
      default: return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
