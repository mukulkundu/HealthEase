export type Role = "PATIENT" | "DOCTOR" | "HOSPITAL_ADMIN" | "RECEPTIONIST";

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

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

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
  schedules?: Schedule[];
}

export interface PaginatedDoctorsResponse {
  doctors: DoctorProfile[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
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
  isPaid: boolean;
  patient?: Pick<User, "id" | "name" | "email" | "phone">;
  doctor?: DoctorProfile;
  payment?: Payment;
  review?: Review | null;
  // Reschedule tracking
  rescheduledAt?: string | null;
  originalDate?: string | null;
  originalStartTime?: string | null;
  rescheduleCount: number;
  videoRoomName?: string;
  videoRoomUrl?: string;
  videoCallStarted?: string;
  videoCallEnded?: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amount: number; // paise
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  createdAt: string;
  patient: Pick<User, "id" | "name">;
}

export type HospitalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  status: HospitalStatus;
  adminId: string;
  createdAt: string;
  departments?: Department[];
}

export interface PaginatedHospitalsResponse {
  hospitals: Hospital[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Department {
  id: string;
  name: string;
  hospitalId: string;
  hospital?: Pick<Hospital, "id" | "name" | "city">;
  departmentDoctors?: DepartmentDoctor[];
}

export interface DepartmentDoctor {
  id: string;
  doctorId: string;
  departmentId: string;
  consultationFee: number;
  isActive: boolean;
  doctor?: DoctorProfile;
  department?: Department;
}

export interface HospitalSchedule {
  id: string;
  doctorId: string;
  departmentId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  isActive: boolean;
}

export interface HospitalAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  hospitalId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  isPaid: boolean;
  createdAt: string;
  patient?: Pick<User, "id" | "name" | "phone">;
  doctor?: DoctorProfile;
  department?: Pick<Department, "id" | "name">;
  hospital?: Pick<Hospital, "id" | "name" | "city">;
  payment?: HospitalPaymentRecord;
  videoRoomName?: string;
  videoRoomUrl?: string;
  videoCallStarted?: string;
  videoCallEnded?: string;
}

export interface VideoParticipant {
  userId: string;
  userName: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isLocal: boolean;
}

export interface VideoCallState {
  isInCall: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  participants: VideoParticipant[];
}

export interface HospitalPaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface HospitalStaff {
  id: string;
  userId: string;
  hospitalId: string;
  user?: Pick<User, "id" | "name" | "email" | "role">;
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

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  appointmentId: string;
  isRead: boolean;
  createdAt: string;
  sender: Pick<User, "id" | "name">;
}

export interface Conversation {
  appointmentId: string;
  otherUser: Pick<User, "id" | "name">;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  unreadCount: number;
  appointmentStatus: AppointmentStatus;
  appointmentDate: string;
}