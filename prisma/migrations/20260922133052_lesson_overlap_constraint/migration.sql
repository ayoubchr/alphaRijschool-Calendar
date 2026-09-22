CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Lesson"
  ADD CONSTRAINT lesson_no_overlap
  EXCLUDE USING gist (
    "instructorId" WITH =,
    tsrange("startAt", "endAt") WITH &&
  )
  WHERE (status IN ('PLANNED', 'CONFIRMED'));