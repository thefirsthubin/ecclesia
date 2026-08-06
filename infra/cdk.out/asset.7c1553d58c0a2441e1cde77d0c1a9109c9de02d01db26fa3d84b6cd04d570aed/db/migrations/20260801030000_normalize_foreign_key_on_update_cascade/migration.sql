-- Normalize every foreign key's ON UPDATE behavior to CASCADE, matching
-- Prisma's implicit default for relations that don't declare `onUpdate`
-- explicitly in schema.prisma. The first migration's hand-written DDL
-- never specified ON UPDATE on any REFERENCES clause, so Postgres
-- defaulted it to NO ACTION - this was the one remaining real difference
-- found by `prisma migrate diff` after the @db.Timestamptz, scope_group_ids
-- default, index-name, and updated_at-default fixes in the prior three
-- migrations. In practice this is inert (every primary key here is an
-- immutable UUID, never updated), but it's fixed for schema.prisma/live-DB
-- parity. This is exactly the script `prisma migrate diff` generated - not
-- independently authored.

-- DropForeignKey
ALTER TABLE "gatherings"."attendance_records" DROP CONSTRAINT "attendance_records_gathering_id_fkey";
ALTER TABLE "gatherings"."attendance_records" DROP CONSTRAINT "attendance_records_person_id_fkey";
ALTER TABLE "gatherings"."attendance_records" DROP CONSTRAINT "attendance_records_recorded_by_person_id_fkey";
ALTER TABLE "gatherings"."gathering_series" DROP CONSTRAINT "gathering_series_branch_id_fkey";
ALTER TABLE "gatherings"."gathering_series" DROP CONSTRAINT "gathering_series_created_by_person_id_fkey";
ALTER TABLE "gatherings"."gathering_series" DROP CONSTRAINT "gathering_series_group_id_fkey";
ALTER TABLE "gatherings"."gatherings" DROP CONSTRAINT "gatherings_branch_id_fkey";
ALTER TABLE "gatherings"."gatherings" DROP CONSTRAINT "gatherings_created_by_person_id_fkey";
ALTER TABLE "gatherings"."gatherings" DROP CONSTRAINT "gatherings_owner_group_id_fkey";
ALTER TABLE "gatherings"."gatherings" DROP CONSTRAINT "gatherings_series_id_fkey";
ALTER TABLE "gatherings"."visitor_intake_submissions" DROP CONSTRAINT "visitor_intake_submissions_branch_id_fkey";
ALTER TABLE "gatherings"."visitor_intake_submissions" DROP CONSTRAINT "visitor_intake_submissions_gathering_id_fkey";
ALTER TABLE "gatherings"."visitor_intake_submissions" DROP CONSTRAINT "visitor_intake_submissions_person_id_fkey";
ALTER TABLE "insights"."alerts" DROP CONSTRAINT "alerts_branch_id_fkey";
ALTER TABLE "insights"."alerts" DROP CONSTRAINT "alerts_resolved_by_person_id_fkey";
ALTER TABLE "insights"."engagement_signals" DROP CONSTRAINT "engagement_signals_branch_id_fkey";
ALTER TABLE "insights"."engagement_signals" DROP CONSTRAINT "engagement_signals_group_id_fkey";
ALTER TABLE "insights"."pulse_score_history" DROP CONSTRAINT "pulse_score_history_branch_id_fkey";
ALTER TABLE "insights"."pulse_scores" DROP CONSTRAINT "pulse_scores_branch_id_fkey";
ALTER TABLE "ministry"."staffing_targets" DROP CONSTRAINT "staffing_targets_branch_id_fkey";
ALTER TABLE "ministry"."staffing_targets" DROP CONSTRAINT "staffing_targets_created_by_person_id_fkey";
ALTER TABLE "ministry"."staffing_targets" DROP CONSTRAINT "staffing_targets_gathering_id_fkey";
ALTER TABLE "ministry"."staffing_targets" DROP CONSTRAINT "staffing_targets_group_id_fkey";
ALTER TABLE "ministry"."worker_availability" DROP CONSTRAINT "worker_availability_branch_id_fkey";
ALTER TABLE "ministry"."worker_availability" DROP CONSTRAINT "worker_availability_person_id_fkey";
ALTER TABLE "pastoral_care"."follow_up_tasks" DROP CONSTRAINT "follow_up_tasks_assigned_to_person_id_fkey";
ALTER TABLE "pastoral_care"."follow_up_tasks" DROP CONSTRAINT "follow_up_tasks_branch_id_fkey";
ALTER TABLE "pastoral_care"."follow_up_tasks" DROP CONSTRAINT "follow_up_tasks_created_by_person_id_fkey";
ALTER TABLE "pastoral_care"."follow_up_tasks" DROP CONSTRAINT "follow_up_tasks_escalated_to_person_id_fkey";
ALTER TABLE "pastoral_care"."follow_up_tasks" DROP CONSTRAINT "follow_up_tasks_group_id_fkey";
ALTER TABLE "pastoral_care"."follow_up_tasks" DROP CONSTRAINT "follow_up_tasks_person_id_fkey";
ALTER TABLE "pastoral_care"."pastoral_notes" DROP CONSTRAINT "pastoral_notes_author_person_id_fkey";
ALTER TABLE "pastoral_care"."pastoral_notes" DROP CONSTRAINT "pastoral_notes_branch_id_fkey";
ALTER TABLE "pastoral_care"."pastoral_notes" DROP CONSTRAINT "pastoral_notes_person_id_fkey";
ALTER TABLE "pastoral_care"."poimen_enrollments" DROP CONSTRAINT "poimen_enrollments_branch_id_fkey";
ALTER TABLE "pastoral_care"."poimen_enrollments" DROP CONSTRAINT "poimen_enrollments_person_id_fkey";
ALTER TABLE "pastoral_care"."silent_drift_flags" DROP CONSTRAINT "silent_drift_flags_assigned_shepherd_person_id_fkey";
ALTER TABLE "pastoral_care"."silent_drift_flags" DROP CONSTRAINT "silent_drift_flags_branch_id_fkey";
ALTER TABLE "pastoral_care"."silent_drift_flags" DROP CONSTRAINT "silent_drift_flags_group_id_fkey";
ALTER TABLE "pastoral_care"."silent_drift_flags" DROP CONSTRAINT "silent_drift_flags_person_id_fkey";
ALTER TABLE "people"."group_memberships" DROP CONSTRAINT "group_memberships_branch_id_fkey";
ALTER TABLE "people"."group_memberships" DROP CONSTRAINT "group_memberships_group_id_fkey";
ALTER TABLE "people"."group_memberships" DROP CONSTRAINT "group_memberships_person_id_fkey";
ALTER TABLE "people"."groups" DROP CONSTRAINT "groups_branch_id_fkey";
ALTER TABLE "people"."persons" DROP CONSTRAINT "persons_branch_id_fkey";
ALTER TABLE "people"."persons" DROP CONSTRAINT "persons_guardian_person_id_fkey";
ALTER TABLE "people"."role_assignments" DROP CONSTRAINT "role_assignments_branch_id_fkey";
ALTER TABLE "people"."role_assignments" DROP CONSTRAINT "role_assignments_granted_by_user_id_fkey";
ALTER TABLE "people"."role_assignments" DROP CONSTRAINT "role_assignments_group_id_fkey";
ALTER TABLE "people"."role_assignments" DROP CONSTRAINT "role_assignments_person_id_fkey";
ALTER TABLE "platform"."audit_log" DROP CONSTRAINT "audit_log_actor_user_id_fkey";
ALTER TABLE "platform"."audit_log" DROP CONSTRAINT "audit_log_branch_id_fkey";
ALTER TABLE "platform"."branches" DROP CONSTRAINT "branches_council_id_fkey";
ALTER TABLE "platform"."configurations" DROP CONSTRAINT "configurations_branch_id_fkey";
ALTER TABLE "platform"."sessions" DROP CONSTRAINT "sessions_user_id_fkey";
ALTER TABLE "platform"."users" DROP CONSTRAINT "users_branch_id_fkey";
ALTER TABLE "platform"."users" DROP CONSTRAINT "users_person_id_fkey";
ALTER TABLE "stewardship"."expenses" DROP CONSTRAINT "expenses_approved_by_person_id_fkey";
ALTER TABLE "stewardship"."expenses" DROP CONSTRAINT "expenses_branch_id_fkey";
ALTER TABLE "stewardship"."expenses" DROP CONSTRAINT "expenses_requested_by_person_id_fkey";
ALTER TABLE "stewardship"."expenses" DROP CONSTRAINT "expenses_transaction_id_fkey";
ALTER TABLE "stewardship"."financial_transaction_events" DROP CONSTRAINT "financial_transaction_events_actor_user_id_fkey";
ALTER TABLE "stewardship"."financial_transaction_events" DROP CONSTRAINT "financial_transaction_events_transaction_id_fkey";
ALTER TABLE "stewardship"."financial_transactions" DROP CONSTRAINT "financial_transactions_branch_id_fkey";
ALTER TABLE "stewardship"."financial_transactions" DROP CONSTRAINT "financial_transactions_giver_person_id_fkey";
ALTER TABLE "stewardship"."financial_transactions" DROP CONSTRAINT "financial_transactions_source_group_id_fkey";
ALTER TABLE "stewardship"."pledges" DROP CONSTRAINT "pledges_branch_id_fkey";
ALTER TABLE "stewardship"."pledges" DROP CONSTRAINT "pledges_fulfilled_transaction_id_fkey";
ALTER TABLE "stewardship"."pledges" DROP CONSTRAINT "pledges_person_id_fkey";
ALTER TABLE "stewardship"."pledges" DROP CONSTRAINT "pledges_project_id_fkey";
ALTER TABLE "stewardship"."projects" DROP CONSTRAINT "projects_branch_id_fkey";
ALTER TABLE "stewardship"."projects" DROP CONSTRAINT "projects_created_by_person_id_fkey";

-- AddForeignKey
ALTER TABLE "platform"."branches" ADD CONSTRAINT "branches_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "platform"."councils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform"."users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "platform"."users" ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."configurations" ADD CONSTRAINT "configurations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform"."audit_log" ADD CONSTRAINT "audit_log_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform"."audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "people"."groups" ADD CONSTRAINT "groups_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "people"."persons" ADD CONSTRAINT "persons_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "people"."persons" ADD CONSTRAINT "persons_guardian_person_id_fkey" FOREIGN KEY ("guardian_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "people"."role_assignments" ADD CONSTRAINT "role_assignments_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "people"."role_assignments" ADD CONSTRAINT "role_assignments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "people"."role_assignments" ADD CONSTRAINT "role_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "people"."role_assignments" ADD CONSTRAINT "role_assignments_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "platform"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "people"."group_memberships" ADD CONSTRAINT "group_memberships_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "people"."group_memberships" ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."poimen_enrollments" ADD CONSTRAINT "poimen_enrollments_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_assigned_to_person_id_fkey" FOREIGN KEY ("assigned_to_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_escalated_to_person_id_fkey" FOREIGN KEY ("escalated_to_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."silent_drift_flags" ADD CONSTRAINT "silent_drift_flags_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."silent_drift_flags" ADD CONSTRAINT "silent_drift_flags_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."silent_drift_flags" ADD CONSTRAINT "silent_drift_flags_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."silent_drift_flags" ADD CONSTRAINT "silent_drift_flags_assigned_shepherd_person_id_fkey" FOREIGN KEY ("assigned_shepherd_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."pastoral_notes" ADD CONSTRAINT "pastoral_notes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."pastoral_notes" ADD CONSTRAINT "pastoral_notes_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pastoral_care"."pastoral_notes" ADD CONSTRAINT "pastoral_notes_author_person_id_fkey" FOREIGN KEY ("author_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ministry"."staffing_targets" ADD CONSTRAINT "staffing_targets_gathering_id_fkey" FOREIGN KEY ("gathering_id") REFERENCES "gatherings"."gatherings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ministry"."staffing_targets" ADD CONSTRAINT "staffing_targets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ministry"."staffing_targets" ADD CONSTRAINT "staffing_targets_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ministry"."worker_availability" ADD CONSTRAINT "worker_availability_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gathering_series" ADD CONSTRAINT "gathering_series_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gathering_series" ADD CONSTRAINT "gathering_series_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gathering_series" ADD CONSTRAINT "gathering_series_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gatherings" ADD CONSTRAINT "gatherings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gatherings" ADD CONSTRAINT "gatherings_owner_group_id_fkey" FOREIGN KEY ("owner_group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gatherings" ADD CONSTRAINT "gatherings_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "gatherings"."gathering_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gatherings"."gatherings" ADD CONSTRAINT "gatherings_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gatherings"."attendance_records" ADD CONSTRAINT "attendance_records_gathering_id_fkey" FOREIGN KEY ("gathering_id") REFERENCES "gatherings"."gatherings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gatherings"."attendance_records" ADD CONSTRAINT "attendance_records_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gatherings"."attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_person_id_fkey" FOREIGN KEY ("recorded_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gatherings"."visitor_intake_submissions" ADD CONSTRAINT "visitor_intake_submissions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gatherings"."visitor_intake_submissions" ADD CONSTRAINT "visitor_intake_submissions_gathering_id_fkey" FOREIGN KEY ("gathering_id") REFERENCES "gatherings"."gatherings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gatherings"."visitor_intake_submissions" ADD CONSTRAINT "visitor_intake_submissions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stewardship"."financial_transactions" ADD CONSTRAINT "financial_transactions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stewardship"."financial_transactions" ADD CONSTRAINT "financial_transactions_source_group_id_fkey" FOREIGN KEY ("source_group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stewardship"."financial_transactions" ADD CONSTRAINT "financial_transactions_giver_person_id_fkey" FOREIGN KEY ("giver_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stewardship"."financial_transaction_events" ADD CONSTRAINT "financial_transaction_events_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "stewardship"."financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stewardship"."financial_transaction_events" ADD CONSTRAINT "financial_transaction_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "platform"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stewardship"."expenses" ADD CONSTRAINT "expenses_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "stewardship"."financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stewardship"."expenses" ADD CONSTRAINT "expenses_requested_by_person_id_fkey" FOREIGN KEY ("requested_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stewardship"."expenses" ADD CONSTRAINT "expenses_approved_by_person_id_fkey" FOREIGN KEY ("approved_by_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stewardship"."projects" ADD CONSTRAINT "projects_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stewardship"."projects" ADD CONSTRAINT "projects_created_by_person_id_fkey" FOREIGN KEY ("created_by_person_id") REFERENCES "people"."persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stewardship"."pledges" ADD CONSTRAINT "pledges_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "stewardship"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stewardship"."pledges" ADD CONSTRAINT "pledges_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stewardship"."pledges" ADD CONSTRAINT "pledges_fulfilled_transaction_id_fkey" FOREIGN KEY ("fulfilled_transaction_id") REFERENCES "stewardship"."financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "insights"."engagement_signals" ADD CONSTRAINT "engagement_signals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "insights"."engagement_signals" ADD CONSTRAINT "engagement_signals_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "people"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "insights"."pulse_scores" ADD CONSTRAINT "pulse_scores_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "insights"."pulse_score_history" ADD CONSTRAINT "pulse_score_history_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "insights"."alerts" ADD CONSTRAINT "alerts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "platform"."branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "insights"."alerts" ADD CONSTRAINT "alerts_resolved_by_person_id_fkey" FOREIGN KEY ("resolved_by_person_id") REFERENCES "people"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
