-- Rename 7 indexes to match Prisma's default naming convention exactly,
-- so `schema.prisma` and the live database agree bit-for-bit (confirmed
-- via `prisma migrate diff` against the applied first migration - these
-- were the only real drift left after fixing the @db.Timestamptz and
-- scope_group_ids default mismatches in db/schema.prisma). Purely
-- cosmetic - no data or behavior change.

ALTER INDEX "insights"."engagement_signals_branch_id_type_occurred_idx"
  RENAME TO "engagement_signals_branch_id_signal_type_occurred_at_idx";

ALTER INDEX "insights"."pulse_score_history_branch_scope_computed_idx"
  RENAME TO "pulse_score_history_branch_id_scope_type_scope_id_computed__idx";

ALTER INDEX "ministry"."worker_availability_person_id_range_idx"
  RENAME TO "worker_availability_person_id_unavailable_from_unavailable__idx";

ALTER INDEX "people"."group_memberships_group_id_started_ended_idx"
  RENAME TO "group_memberships_group_id_started_at_ended_at_idx";

ALTER INDEX "people"."group_memberships_person_id_started_ended_idx"
  RENAME TO "group_memberships_person_id_started_at_ended_at_idx";

ALTER INDEX "people"."role_assignments_person_id_effective_idx"
  RENAME TO "role_assignments_person_id_effective_from_effective_to_idx";

ALTER INDEX "stewardship"."financial_transactions_branch_id_type_state_idx"
  RENAME TO "financial_transactions_branch_id_type_current_state_idx";
