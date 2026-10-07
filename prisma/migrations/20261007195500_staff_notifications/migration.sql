CREATE TABLE "StaffNotification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffNotification_pkey" PRIMARY KEY ("id")
);

REVOKE ALL ON TABLE "StaffNotification" FROM anon, authenticated;
ALTER TABLE "StaffNotification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_notification_admin ON "StaffNotification"
  FOR SELECT TO authenticated
  USING (public.app_role() = 'ADMIN');

INSERT INTO "StaffNotification" ("id", "title", "body", "href", "createdAt")
SELECT
  'booking-' || d."id",
  'Nieuwe boeking',
  d."firstName" || ' ' || d."lastName" || ' boekte ' || p."name" || '.',
  '/admin/dossiers?dossier=' || d."id",
  d."createdAt"
FROM "Dossier" d
JOIN "Package" p ON p."id" = d."packageId"
WHERE d."createdAt" > NOW() - INTERVAL '21 days';
