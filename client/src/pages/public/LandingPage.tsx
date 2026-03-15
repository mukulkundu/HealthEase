import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "../../components/layout/Navbar";
import {
  Stethoscope,
  CalendarCheck,
  UserPlus,
  Search,
  ArrowRight,
  Heart,
  Brain,
  Baby,
  Bone,
  Activity,
  Smile,
} from "lucide-react";

const SPECIALIZATIONS = [
  { name: "Cardiology", icon: Heart },
  { name: "Dermatology", icon: Activity },
  { name: "Pediatrics", icon: Baby },
  { name: "Orthopedics", icon: Bone },
  { name: "Neurology", icon: Brain },
  { name: "General Medicine", icon: Stethoscope },
  { name: "Gynecology", icon: Heart },
  { name: "Psychiatry", icon: Smile },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 max-w-2xl leading-tight">
          Book Doctor Appointments Instantly
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-xl">
          Connect with independent doctors, view real-time availability, and book your slot in minutes. No waiting rooms, no phone calls.
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
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                <UserPlus className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Create your account</h3>
              <p className="text-sm text-gray-500">Sign up as a patient or doctor in seconds</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Find or get discovered</h3>
              <p className="text-sm text-gray-500">Patients find doctors by specialization. Doctors set their schedule and go live instantly.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Book or accept appointments</h3>
              <p className="text-sm text-gray-500">Patients book slots, doctors confirm. Simple.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 px-4 bg-gray-50 border-y">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">500+</p>
            <p className="text-sm text-gray-500">Doctors</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">10,000+</p>
            <p className="text-sm text-gray-500">Appointments</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">50+</p>
            <p className="text-sm text-gray-500">Specializations</p>
          </div>
        </div>
      </section>

      {/* Specializations grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by Specialization</h2>
          <p className="text-gray-500 mb-8">Find the right specialist for your needs</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SPECIALIZATIONS.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                to={`/doctors?specialization=${encodeURIComponent(name)}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border text-blue-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Doctors */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Are you a Doctor?</h2>
          <p className="text-blue-100 mb-8">
            Join HealthEase and manage your practice digitally. Set your schedule, accept bookings, and grow your patient base.
          </p>
          <ul className="text-left max-w-sm mx-auto space-y-2 mb-8">
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span> Go live instantly — no approval required
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span> Set your own schedule and consultation fee
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-300">✓</span> Manage all appointments in one place
            </li>
          </ul>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/register">Start for Free</Link>
          </Button>
        </div>
      </section>

      <footer className="py-6 px-4 border-t text-center text-sm text-gray-400">
        © {new Date().getFullYear()} HealthEase. All rights reserved.
      </footer>
    </div>
  );
}
