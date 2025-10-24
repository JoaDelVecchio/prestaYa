-- Pragmatic baseline RLS helpers. Call set_claims(org_id, user_id) at session start.
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.set_claims(org uuid, uid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org::text, true);
  PERFORM set_config('app.current_user_id', uid::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION app_private.current_org_id()
RETURNS uuid AS $$
BEGIN
  RETURN nullif(current_setting('app.current_org_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION app_private.current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN nullif(current_setting('app.current_user_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on multi-tenant tables.
ALTER TABLE "Organisation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Installment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Receipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserOrganisation" ENABLE ROW LEVEL SECURITY;

-- Policies enforce org scoping.
CREATE POLICY org_isolation ON "Loan"
  USING ("orgId" = app_private.current_org_id())
  WITH CHECK ("orgId" = app_private.current_org_id());

CREATE POLICY org_isolation_installment ON "Installment"
  USING ("orgId" = app_private.current_org_id())
  WITH CHECK ("orgId" = app_private.current_org_id());

CREATE POLICY org_isolation_payment ON "Payment"
  USING ("orgId" = app_private.current_org_id())
  WITH CHECK ("orgId" = app_private.current_org_id());

CREATE POLICY org_isolation_activity ON "ActivityLog"
  USING ("orgId" = app_private.current_org_id())
  WITH CHECK ("orgId" = app_private.current_org_id());

CREATE POLICY org_isolation_receipt ON "Receipt"
  USING ("orgId" = app_private.current_org_id())
  WITH CHECK ("orgId" = app_private.current_org_id());

CREATE POLICY org_membership ON "UserOrganisation"
  USING ("organisationId" = app_private.current_org_id())
  WITH CHECK ("organisationId" = app_private.current_org_id());
