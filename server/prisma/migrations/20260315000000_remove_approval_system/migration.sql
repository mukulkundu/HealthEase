-- Update any ADMIN users to DOCTOR before removing enum value
UPDATE "User" SET role = 'DOCTOR' WHERE role = 'ADMIN';

-- Remove isApproved column from DoctorProfile
ALTER TABLE "DoctorProfile" DROP COLUMN IF EXISTS "isApproved";

-- Recreate Role enum without ADMIN (drop default first, then alter type)
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
DROP TYPE IF EXISTS "Role_new";
CREATE TYPE "Role_new" AS ENUM ('PATIENT', 'DOCTOR');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING (role::text::"Role_new");
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PATIENT'::"Role";
