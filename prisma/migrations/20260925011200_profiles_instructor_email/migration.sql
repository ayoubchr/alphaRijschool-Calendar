ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'STUDENT';

ALTER TABLE "Instructor" ADD COLUMN "email" TEXT;

CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "instructorId" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TABLE "StaffUser";

DELETE FROM "AvailabilityRule"
WHERE left("startTime", 5) NOT IN ('08:00', '10:00', '12:00', '14:00', '16:00', '18:00');

DELETE FROM "AvailabilityException"
WHERE left("startTime", 5) NOT IN ('00:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00');

