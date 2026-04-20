import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const location = useLocation();
  if (location.pathname.startsWith("/call")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-white overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}