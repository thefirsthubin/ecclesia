-- Bank Deposit Confirmations.
--
-- FR-STW-07's bank-deposit comparison half: "aggregate Verified
-- transactions into a weekly reconciliation view comparing recorded
-- totals against confirmed bank deposits." Flagged in
-- STEWARDSHIP_DESIGN_NOTES.md as "needs a schema addition, not an
-- application-layer guess" - this migration is that addition. See
-- db/schema.prisma's BankDepositConfirmation model for the full design
-- comment.
--
-- Hand-written, not `prisma migrate dev`-generated, for the same sandbox
-- reason every migration since the first one has been (db/migrations/README.md):
-- no live database or package registry access in the environment that
-- authored it.
--
-- No GRANT statements needed here - the Row-Level Security sprint's
-- `20260801050000_row_level_security_enforcement` migration already added
-- `ALTER DEFAULT PRIVILEGES FOR ROLE ecclesia IN SCHEMA stewardship GRANT
-- ... TO ecclesia_app`, which covers any table created by a future
-- migration (still run as `ecclesia`, the owner) automatically - see that
-- migration's own comment.

CREATE TABLE stewardship.bank_deposit_confirmations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id              UUID NOT NULL REFERENCES platform.branches (id) ON DELETE CASCADE,
  group_id               UUID NOT NULL REFERENCES people.groups (id) ON DELETE CASCADE,
  week_start_date        DATE NOT NULL,
  deposited_amount_minor BIGINT NOT NULL,
  currency               CHAR(3) NOT NULL DEFAULT 'GHS',
  bank_reference         TEXT,
  confirmed_by_person_id UUID NOT NULL REFERENCES people.persons (id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bank_deposit_confirmations_group_id_week_start_date_key UNIQUE (group_id, week_start_date)
);

CREATE INDEX bank_deposit_confirmations_branch_id_week_start_date_idx
  ON stewardship.bank_deposit_confirmations (branch_id, week_start_date);

-- Same branch_id RLS policy shape as every other Branch-scoped table in
-- this schema (see the init migration's own "Row-Level Security" section).
ALTER TABLE stewardship.bank_deposit_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_deposit_confirmations_branch_isolation ON stewardship.bank_deposit_confirmations
  USING (branch_id = current_setting('app.current_branch_id')::uuid);
