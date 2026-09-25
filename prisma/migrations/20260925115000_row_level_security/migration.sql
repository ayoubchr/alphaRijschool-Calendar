-- Helpers read Profile as the table owner, so policies can check a role
-- without recursing through Profile's own row security.
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM "Profile" WHERE id = auth.uid()::text
$$;

CREATE OR REPLACE FUNCTION public.app_instructor_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "instructorId" FROM "Profile" WHERE id = auth.uid()::text
$$;

CREATE OR REPLACE FUNCTION public.app_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(email) FROM "Profile" WHERE id = auth.uid()::text
$$;

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_instructor_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_instructor_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.app_email() TO anon, authenticated;

REVOKE ALL ON TABLE "Package" FROM anon, authenticated;
REVOKE ALL ON TABLE "Instructor" FROM anon, authenticated;
REVOKE ALL ON TABLE "AvailabilityRule" FROM anon, authenticated;
REVOKE ALL ON TABLE "AvailabilityException" FROM anon, authenticated;
REVOKE ALL ON TABLE "Dossier" FROM anon, authenticated;
REVOKE ALL ON TABLE "MagicLink" FROM anon, authenticated;
REVOKE ALL ON TABLE "Lesson" FROM anon, authenticated;
REVOKE ALL ON TABLE "Payment" FROM anon, authenticated;
REVOKE ALL ON TABLE "Profile" FROM anon, authenticated;

GRANT SELECT ON TABLE "Package" TO anon, authenticated;
GRANT SELECT ("id", "name", "transmission", "active") ON TABLE "Instructor" TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AvailabilityRule" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AvailabilityException" TO authenticated;
GRANT SELECT ON TABLE "Dossier" TO authenticated;
GRANT SELECT ON TABLE "Lesson" TO authenticated;
GRANT SELECT ON TABLE "Payment" TO authenticated;
GRANT SELECT ON TABLE "Profile" TO authenticated;

ALTER TABLE "Package" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Instructor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvailabilityRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AvailabilityException" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dossier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MagicLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY package_read ON "Package"
  FOR SELECT TO anon, authenticated
  USING (active = true OR public.app_role() = 'ADMIN');

CREATE POLICY instructor_read ON "Instructor"
  FOR SELECT TO anon, authenticated
  USING (
    active = true
    OR public.app_role() = 'ADMIN'
    OR id = public.app_instructor_id()
  );

CREATE POLICY availability_rule_manage ON "AvailabilityRule"
  FOR ALL TO authenticated
  USING (public.app_role() = 'ADMIN' OR "instructorId" = public.app_instructor_id())
  WITH CHECK (public.app_role() = 'ADMIN' OR "instructorId" = public.app_instructor_id());

CREATE POLICY availability_exception_manage ON "AvailabilityException"
  FOR ALL TO authenticated
  USING (public.app_role() = 'ADMIN' OR "instructorId" = public.app_instructor_id())
  WITH CHECK (public.app_role() = 'ADMIN' OR "instructorId" = public.app_instructor_id());

CREATE POLICY dossier_read ON "Dossier"
  FOR SELECT TO authenticated
  USING (
    public.app_role() = 'ADMIN'
    OR lower(email) = public.app_email()
  );

CREATE POLICY lesson_read ON "Lesson"
  FOR SELECT TO authenticated
  USING (
    public.app_role() = 'ADMIN'
    OR "instructorId" = public.app_instructor_id()
    OR EXISTS (
      SELECT 1 FROM "Dossier" AS dossier
      WHERE dossier.id = "Lesson"."dossierId"
        AND lower(dossier.email) = public.app_email()
    )
  );

CREATE POLICY payment_read ON "Payment"
  FOR SELECT TO authenticated
  USING (
    public.app_role() = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM "Dossier" AS dossier
      WHERE dossier.id = "Payment"."dossierId"
        AND lower(dossier.email) = public.app_email()
    )
  );

CREATE POLICY profile_read ON "Profile"
  FOR SELECT TO authenticated
  USING (id = auth.uid()::text OR public.app_role() = 'ADMIN');
