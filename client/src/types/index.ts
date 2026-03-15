export type Role = "PATIENT" | "DOCTOR";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  experience: number;
  qualifications: string[];
  languages: string[];
  consultationFee: number;
  bio?: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  isIndependent: boolean;
  user: Pick<User, "id" | "name" | "email" | "phone">;
}

export interface Schedule {
  id: string;
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  isActive: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  patient?: Pick<User, "id" | "name" | "email" | "phone">;
  doctor?: DoctorProfile;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** Backend success response shape: { success, message, data } */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  message: string;
  status?: number;
}