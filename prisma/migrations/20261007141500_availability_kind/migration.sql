CREATE TYPE "AvailabilityKind" AS ENUM ('LESSON', 'EXAM');

ALTER TABLE "AvailabilityRule" ADD COLUMN "kind" "AvailabilityKind" NOT NULL DEFAULT 'LESSON';

ALTER TABLE "AvailabilityException" ADD COLUMN "kind" "AvailabilityKind" NOT NULL DEFAULT 'LESSON';
