import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "../../components/layout/Navbar";
import {
  Stethoscope,
  CalendarCheck,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Search,
} from "lucide-react";

const features = [
  {
    icon: <Search className="h-5 w-5 text-blue-600" />,
    title: "Find the Right Doctor",
    description: "Browse verified doctors by specialization and availability.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
    title: "Book Instantly",
    description: "See real-time slots and confirm appointments in seconds.",
  },
  {
    icon: <Clock className="h-5 w-5 text-blue-600" />,
    title: "No More Waiting",
    description: "Pick your time slot in advance and skip the queue.",
  },
  {
    icon: <Shield className="h-5 w-5 text-blue-600" />,
    title: "Verified Professionals",
    description: "Every doctor on HealthEase is reviewed and approved.",
  },
];

const specializations = [
  "Cardiology", "Dermatology", "Pediatrics",
  "Orthopedics", "Neurology", "General Medicine",
  "Gynecology", "Psychiatry",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-linear-to-b from-blue-50 to-white">
        <Badge variant="secondary" className="mb-4 text-blue-700 bg-blue-100">
          Healthcare made simple
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-2xl leading-tight">
          Book a Doctor Appointment in Minutes
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl">
          Discover trusted doctors, view their availability, and book your
          appointment — all in one place. No calls, no waiting rooms.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/doctors">
              Find a Doctor <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/register">Join as a Doctor</Link>
          </Button>
        </div>

        {/* Trust row */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Verified doctors only
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="h-4 w-4 text-blue-500" />
            Real-time slot booking
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-green-500" />
            Secure & private
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Why patients love HealthEase
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 p-5 rounded-xl border bg-gray-50 hover:shadow-sm transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Browse by Specialization
          </h2>
          <p className="text-gray-500 mb-8">
            Find the right specialist for your needs
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {specializations.map((s) => (
              <Link key={s} to={`/doctors?specialization=${s}`}>
                <Badge
                  variant="outline"
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {s}
                </Badge>
              </Link>
            ))}
          </div>
          <Button className="mt-8" variant="outline" asChild>
            <Link to="/doctors">View All Doctors</Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <div className="max-w-xl mx-auto">
          <Stethoscope className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Are you a Doctor?</h2>
          <p className="text-blue-100 mb-6">
            Join HealthEase and manage your appointments digitally. Set your
            schedule, accept bookings, and focus on what matters — your patients.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t text-center text-sm text-gray-400">
        © {new Date().getFullYear()} HealthEase. All rights reserved.
      </footer>
    </div>
  );
}