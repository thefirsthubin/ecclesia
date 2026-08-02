-- Worker milestone: platform.processed_events (Blueprint §10.5 idempotency
-- table). See db/schema.prisma's ProcessedEvent model doc comment and
-- db/DESIGN_NOTES.md's "Worker milestone" entry for the full citation and
-- the "one shared table with a consumerName discriminator, not three
-- near-identical tables" design decision. Hand-written, following the same
-- CREATE TABLE / index / RLS pattern the init migration used for
-- platform.audit_log (the closest existing platform-schema precedent), and
-- specifying ON UPDATE CASCADE explicitly on the new foreign key to match
-- the current normalized state established by the prior
-- normalize_foreign_key_on_update_cascade migration - not the init
-- migration's original (since-corrected) implicit-NO-ACTION default.

CREATE TABLE platform.processed_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     UUID NOT NULL REFERENCES platform.branches (id) ON DELETE CASCADE ON UPDATE CASCADE,
  consumer_name TEXT NOT NULL,
  event_id      UUID NOT NULL,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX processed_events_consumer_name_event_id_key ON platform.processed_events (consumer_name, event_id);
CREATE INDEX processed_events_branch_id_idx ON platform.processed_events (branch_id);

ALTER TABLE platform.processed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY processed_events_branch_isolation ON platform.processed_events
  USING (branch_id = current_setting('app.current_branch_id')::uuid);
