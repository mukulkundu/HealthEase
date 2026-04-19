import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Search,
  UserCircle,
  MessageSquare,
  IndianRupee,
  Building2,
  Users,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  showUnreadDot?: boolean;
}

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const unreadMessages = useNotificationsStore((s) => s.unreadMessages);

  const patientNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Find Doctors", href: "/doctors", icon: <Search className="h-4 w-4" /> },
    { label: "My Appointments", href: "/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
    { label: "Hospital Appointments", href: "/hospital-appointments", icon: <Building2 className="h-4 w-4" /> },
    { label: "Messages", href: "/chat", icon: <MessageSquare className="h-4 w-4" />, showUnreadDot: unreadMessages > 0 },
    { label: "My Profile", href: "/patient/profile", icon: <UserCircle className="h-4 w-4" /> },
  ];

  const doctorNav: NavItem[] = [
    { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "My Profile", href: "/doctor/profile", icon: <UserCircle className="h-4 w-4" /> },
    { label: "My Schedule", href: "/doctor/schedule", icon: <Calendar className="h-4 w-4" /> },
    { label: "Appointments", href: "/doctor/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
    { label: "Hospital Appointments", href: "/doctor/hospital-appointments", icon: <Building2 className="h-4 w-4" /> },
    { label: "My Hospitals", href: "/doctor/hospitals", icon: <Stethoscope className="h-4 w-4" /> },
    { label: "Earnings", href: "/doctor/earnings", icon: <IndianRupee className="h-4 w-4" /> },
    { label: "Messages", href: "/chat", icon: <MessageSquare className="h-4 w-4" />, showUnreadDot: unreadMessages > 0 },
  ];

  const hospitalAdminNav: NavItem[] = [
    { label: "Dashboard", href: "/hospital/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Setup Hospital", href: "/hospital/setup", icon: <Building2 className="h-4 w-4" /> },
    { label: "Departments", href: "/hospital/departments", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Staff", href: "/hospital/staff", icon: <Users className="h-4 w-4" /> },
    { label: "Appointments", href: "/hospital/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
  ];

  const receptionistNav: NavItem[] = [
    { label: "Reception", href: "/hospital/reception", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Appointments", href: "/hospital/reception/appointments", icon: <CalendarCheck className="h-4 w-4" /> },
  ];

  const navItems =
    user?.role === "DOCTOR" ? doctorNav
    : user?.role === "HOSPITAL_ADMIN" ? hospitalAdminNav
    : user?.role === "RECEPTIONIST" ? receptionistNav
    : patientNav;

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r bg-gray-50 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === item.href || location.pathname.startsWith(item.href + "/")
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span className="relative">
              {item.icon}
              {item.showUnreadDot && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600" />
              )}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}