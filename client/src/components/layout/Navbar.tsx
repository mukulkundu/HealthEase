import { Link} from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stethoscope, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "DOCTOR") return "/doctor/dashboard";
    return "/dashboard";
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">HealthEase</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/doctors"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Find Doctors
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardLink()}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated && user?.role === "PATIENT" && (
              <Link
                to="/appointments"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                My Appointments
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()}>Dashboard</Link>
                  </DropdownMenuItem>
                  {user?.role === "DOCTOR" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/doctor/schedule">Manage Schedule</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/doctor/appointments">Appointments</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "PATIENT" && (
                    <DropdownMenuItem asChild>
                      <Link to="/appointments">My Appointments</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          <Link
            to="/doctors"
            className="block text-sm font-medium text-gray-700"
            onClick={() => setMobileOpen(false)}
          >
            Find Doctors
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardLink()}
              className="block text-sm font-medium text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {isAuthenticated && user?.role === "PATIENT" && (
            <Link
              to="/appointments"
              className="block text-sm font-medium text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              My Appointments
            </Link>
          )}
          <div className="pt-2 border-t space-y-2">
            {!isAuthenticated ? (
              <>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                Log out
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}