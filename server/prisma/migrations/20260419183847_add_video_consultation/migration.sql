-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoCallEnded" TIMESTAMP(3),
ADD COLUMN     "videoCallStarted" TIMESTAMP(3),
ADD COLUMN     "videoRoomName" TEXT,
ADD COLUMN     "videoRoomUrl" TEXT;

-- AlterTable
ALTER TABLE "HospitalAppointment" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoCallEnded" TIMESTAMP(3),
ADD COLUMN     "videoCallStarted" TIMESTAMP(3),
ADD COLUMN     "videoRoomName" TEXT,
ADD COLUMN     "videoRoomUrl" TEXT;
