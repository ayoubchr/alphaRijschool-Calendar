CREATE TABLE "TheoryDay" (
    "id" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TheoryDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TheoryDay_startAt_key" ON "TheoryDay"("startAt");

ALTER TABLE "Lesson" ALTER COLUMN "instructorId" DROP NOT NULL;

ALTER TABLE "Lesson" DROP CONSTRAINT "lesson_no_overlap";

ALTER TABLE "Lesson"
  ADD CONSTRAINT "lesson_no_overlap"
  EXCLUDE USING gist (
    "instructorId" WITH =,
    tsrange("startAt", "endAt") WITH &&
  )
  WHERE (status IN ('PLANNED', 'CONFIRMED') AND "instructorId" IS NOT NULL);

ALTER TABLE "TheoryDay" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "TheoryDay" FROM anon, authenticated;
GRANT SELECT ON TABLE "TheoryDay" TO anon, authenticated;

CREATE POLICY theory_day_read ON "TheoryDay"
  FOR SELECT TO anon, authenticated
  USING (true);
