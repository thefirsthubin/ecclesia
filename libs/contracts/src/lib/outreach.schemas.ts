import { z } from 'zod';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` Shared Zod
 * schemas for the Outreach bounded context - see
 * MILESTONE_B_DESIGN_NOTES.md Part 4 for the full design. See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 */

export const OUTREACH_CONTACT_OUTCOME_VALUES = ['NOT_INTERESTED', 'FOLLOW_UP_REQUESTED', 'ATTENDED'] as const;
export const outreachContactOutcomeSchema = z.enum(OUTREACH_CONTACT_OUTCOME_VALUES);
export type OutreachContactOutcomeDto = z.infer<typeof outreachContactOutcomeSchema>;

/** `POST /outreach` - `groupId` names the leading Bacenta/Basonta when
 * applicable (optional - a Branch-wide/Assistant-Pastor-led outreach may
 * have none, mirroring `createGatheringSchema`'s own `ownerGroupId`
 * optionality). `notes` deliberately brief - same discipline as
 * `FollowUpTask.description`. */
export const createOutreachSchema = z.object({
  groupId: z.string().uuid().optional(),
  occurredAt: z.string().datetime(),
  location: z.string().trim().min(1).optional(),
  leaderPersonId: z.string().uuid(),
  notes: z.string().trim().min(1).max(500).optional(),
});
export type CreateOutreachInput = z.infer<typeof createOutreachSchema>;

export const outreachResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
  occurredAt: z.string(),
  location: z.string().nullable(),
  leaderPersonId: z.string().uuid(),
  notes: z.string().nullable(),
  createdByPersonId: z.string().uuid(),
  createdAt: z.string(),
});
export type OutreachResponseDto = z.infer<typeof outreachResponseSchema>;

/** `GET /outreach` - mirrors `listGatheringsQuerySchema`'s shape:
 * `groupId` narrows to one Group's own history; `from`/`to` narrow the
 * date range; both omitted lists everything in scope. */
export const listOutreachQuerySchema = z.object({
  groupId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type ListOutreachQuery = z.infer<typeof listOutreachQuerySchema>;

/**
 * `POST /outreach/:outreachId/contacts` - `lastName` is deliberately
 * optional here (unlike `createPersonSchema`'s required `lastName`) - a
 * doorstep encounter often captures only a first name; `promote()`
 * requires one, matching every other Person-creation path, but the
 * lightweight capture itself does not (MILESTONE_B_DESIGN_NOTES.md Part
 * 4's lazy-promotion design).
 */
export const createOutreachContactSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  howReached: z.string().trim().min(1).max(200).optional(),
  outcome: outreachContactOutcomeSchema.optional(),
});
export type CreateOutreachContactInput = z.infer<typeof createOutreachContactSchema>;

export const updateOutreachContactOutcomeSchema = z.object({
  outcome: outreachContactOutcomeSchema,
});
export type UpdateOutreachContactOutcomeInput = z.infer<typeof updateOutreachContactOutcomeSchema>;

/** `POST /outreach/contacts/:id/promote` - see
 * `OutreachContactService.promote`'s own doc comment for why `lastName`
 * is accepted here (required only when the contact itself never captured
 * one) and `overrideDuplicateCheck` mirrors `createPersonSchema`'s own
 * field exactly, for the identical FR-PPL-02 reason. */
export const promoteOutreachContactSchema = z.object({
  lastName: z.string().trim().min(1).optional(),
  overrideDuplicateCheck: z.boolean().default(false),
});
export type PromoteOutreachContactInput = z.infer<typeof promoteOutreachContactSchema>;

export const outreachContactResponseSchema = z.object({
  id: z.string().uuid(),
  outreachId: z.string().uuid(),
  branchId: z.string().uuid(),
  personId: z.string().uuid().nullable(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  howReached: z.string().nullable(),
  outcome: outreachContactOutcomeSchema.nullable(),
  createdAt: z.string(),
});
export type OutreachContactResponseDto = z.infer<typeof outreachContactResponseSchema>;
