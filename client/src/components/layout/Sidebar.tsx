import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const patientNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Find Doctors", href: "/doctors", icon: <Users className="h-4 w-4" /> },
  { label: "My Appointments", href: "/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
];

const doctorNav: NavItem[] = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Appointments", href: "/doctor/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
  { label: "My Schedule", href: "/doctor/schedule", icon: <Calendar className="h-4 w-4" /> },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();

  const navItems = user?.role === "DOCTOR" ? doctorNav : patientNav;

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-gray-50 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}