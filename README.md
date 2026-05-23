# HealthEase

HealthEase is a full-stack healthcare platform that connects patients, doctors, and hospitals in one workflow.
It supports doctor discovery, appointment booking, payments, chat, video consultations, reviews, and role-based dashboards for different user types.

## What This Project Does

HealthEase provides two main care flows:
- **Independent doctor flow**: Patients discover doctors and book direct consultations.
- **Hospital flow**: Patients book with hospital departments and assigned doctors.

The platform supports:
- Authentication and role-based access (`PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `RECEPTIONIST`)
- Schedule and slot management
- Appointment lifecycle (book, reschedule, cancel, status updates)
- Payments (Razorpay-ready flow)
- In-app chat with read/unread handling
- Video consultation support (Daily.co integration)
- Review and rating system
- Doctor earnings analytics

## Tech Stack

### Frontend (`client`)
- React 19 + TypeScript
- Vite
- React Router
- Zustand (state management)
- Axios
- Socket.IO client
- Daily JS SDK
- Tailwind CSS + Radix/shadcn UI ecosystem
- Recharts

### Backend (`server`)
- Node.js + Express 5 + TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication + role middleware
- Socket.IO
- Node-cron jobs
- Razorpay integration
- Resend email support

## High-Level Architecture

- **Frontend SPA** consumes REST APIs and Socket.IO events.
- **Backend module architecture** follows `route -> controller -> service`.
- **Domain modules** are separated under `server/src/modules/*` (auth, doctor, patient, hospital, payment, chat, review, etc.).
- **Realtime layer** handles appointment chat + call signaling over Socket.IO.
- **Scheduled jobs** handle reminders and chat cleanup.
- **Database** schema is managed with Prisma migrations.

## Roles and Capabilities

### Patient
- Browse doctors and hospitals
- Book/cancel/reschedule appointments
- Pay for consultations
- Chat with doctor around appointments
- Join video consultations
- Submit reviews

### Doctor
- Manage profile and schedules
- Access independent and hospital appointments
- Update appointment statuses
- Join/end video consultations
- View earnings and patient history

### Hospital Admin
- Manage hospital profile
- Manage departments
- Assign/remove doctors in departments
- Manage reception staff
- Track and update hospital appointments

### Receptionist
- View hospital appointments
- Update appointment statuses as permitted

## Project Structure

```text
HealthEase/
  client/
    src/
      api/                # Domain API wrappers (auth, doctor, payments, chat, etc.)
      components/         # Shared/layout/ui/video components
      hooks/              # Custom hooks (socket lifecycle, helpers)
      pages/              # Route pages grouped by role/public/auth
      socket/             # Client socket setup
      store/              # Zustand stores (auth, notifications)
      types/              # Shared frontend types
  server/
    prisma/
      schema.prisma       # Database schema
      migrations/         # Prisma SQL migrations
    src/
      config/             # Env, DB, integrations (Daily, Razorpay, etc.)
      middleware/         # Auth, role, validation, error handling
      modules/            # Feature modules (route/controller/service)
      jobs/               # Cron jobs
      socket/             # Socket event handlers
      utils/              # Common helpers
      index.ts            # App bootstrap and route mounting
```

## API Overview

Base URL (local): `http://localhost:5000/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Users
- `PATCH /users/profile`

### Doctors and Schedules
- `GET /doctors`
- `GET /doctors/:id`
- `GET /schedules/:doctorId`
- `GET /schedules/:doctorId/slots`
- `POST /schedules`
- `DELETE /schedules/:id`

### Independent Appointments + Payments
- `POST /appointments`
- `GET /appointments/my`
- `GET /appointments/doctor`
- `PATCH /appointments/:id/reschedule`
- `PATCH /appointments/:id/cancel`
- `PATCH /appointments/:id/status`
- `POST /payments/create-order`
- `POST /payments/verify`

### Hospitals, Departments, Staff
- `GET /hospitals`
- `GET /hospitals/:id`
- `POST /hospitals`
- `GET /hospitals/admin/me`
- `PATCH /hospitals/admin/me`
- `GET /hospitals/staff/my-hospital`
- `GET /departments/hospital/:hospitalId`
- `GET /departments/my`
- `POST /departments`
- `DELETE /departments/:departmentId`
- `POST /staff`
- `GET /staff`
- `DELETE /staff/:staffId`

### Hospital Schedules + Appointments + Payments
- `GET /hospital-schedules/slots/:doctorId/:departmentId`
- `POST /hospital-schedules`
- `GET /hospital-schedules/my/:departmentId`
- `POST /hospital-appointments`
- `GET /hospital-appointments/my`
- `GET /hospital-appointments/doctor`
- `GET /hospital-appointments/hospital`
- `GET /hospital-appointments/reception`
- `PATCH /hospital-appointments/:id/cancel`
- `PATCH /hospital-appointments/:id/status`
- `POST /hospital-payments/order`
- `POST /hospital-payments/verify`

### Chat, Video, Reviews, Earnings
- `GET /chat/conversations`
- `GET /chat/:appointmentId/messages`
- `GET /video/:appointmentId/token`
- `POST /video/:appointmentId/end`
- `POST /reviews`
- `GET /reviews/doctor/:doctorId`
- `GET /reviews/my`
- `GET /reviews/can-review/:appointmentId`
- `GET /earnings/summary`
- `GET /earnings/history`
- `GET /earnings/monthly-chart`

> Note: Many endpoints are protected and role-restricted using auth and authorization middleware.

## Realtime Features (Socket.IO)

The app uses Socket.IO for:
- Appointment room joining
- Realtime chat messaging
- Read receipts and unread updates
- Call signaling (incoming call, call started/ended)

Primary server events are handled in `server/src/socket/socket.handler.ts`.

## Environment Variables

### Server (`server/.env`)
Required:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional (with defaults/fallback behavior):
- `PORT` (default `5000`)
- `NODE_ENV` (default `development`)
- `JWT_ACCESS_EXPIRES_IN` (default `15m`)
- `JWT_REFRESH_EXPIRES_IN` (default `7d`)
- `FRONTEND_URL` (default `http://localhost:5173`)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `DAILY_API_KEY`
- `DAILY_API_URL` (default `https://api.daily.co/v1`)

### Client (`client/.env`)
- `VITE_API_URL` (example: `http://localhost:5000`)
- `VITE_RAZORPAY_KEY_ID` (for checkout integration)

## Getting Started

## 1) Clone and install

```bash
git clone <your-repo-url>
cd HealthEase
cd server && npm install
cd ../client && npm install
```

## 2) Start database (optional Docker path)

```bash
cd server
docker compose up -d
```

If you already have PostgreSQL running locally, configure `DATABASE_URL` accordingly.

## 3) Configure environment files

- Create `server/.env` with required secrets and DB URL.
- Create `client/.env` with `VITE_API_URL`.

## 4) Run Prisma migrations

```bash
cd server
npx prisma migrate deploy
```

For local development workflow, you can also use:

```bash
npx prisma migrate dev
```

## 5) Run the app

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Available Scripts

### Client
- `npm run dev` - start Vite dev server
- `npm run build` - type-check + production build
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

### Server
- `npm run dev` - start backend with file watching
- `npm run build` - compile TypeScript
- `npm run start` - run compiled backend

## Database and Migrations

- Prisma schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/*`
- No seed script is currently configured in server scripts.

## Current Integration Notes

- Payment flow is wired for Razorpay and stores payment records; parts of checkout behavior may be running in mock/simulated mode depending on your environment setup.
- Video flow uses Daily.co and can run in fallback behavior if Daily API credentials are not provided.

## Roadmap Ideas

- Add seed data scripts for local demo setup
- Add API docs generation (OpenAPI/Swagger)
- Add automated test suites (unit + integration + e2e)
- Add deployment docs for production environments

## License

No explicit license file is currently present in this repository.
