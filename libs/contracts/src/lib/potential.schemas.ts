import { z } from 'zod';

/**
 * `[Milestone C: Portal Read Models + Analytics, Phase 1 decision #4;
 * completed in Milestone C.1.1]` Shared Zod schemas for the `Potential`
 * domain concept - see `db/schema.prisma`'s own `Potential` model doc
 * comment for the full design. Mirrors `outreach.schemas.ts`'s shape
 * closely - same "own action namespace, own minimal contract" pattern.
 * See `people.schemas.ts`'s own doc comment for why enums are
 * re-declared here rather than imported - `libs/contracts` is a leaf
 * library.
 */

export const POTENTIAL_SOURCE_VALUES = ['OUTREACH', 'REFERRAL', 'WALK_IN', 'OTHER'] as const;
export const potentialSourceSchema = z.enum(POTENTIAL_SOURCE_VALUES);
export type PotentialSourceDto = z.infer<typeof potentialSourceSchema>;

export const POTENTIAL_STATUS_VALUES = ['NEW', 'IN_PROGRESS', 'CONVERTED', 'CLOSED'] as const;
export const potentialStatusSchema = z.enum(POTENTIAL_STATUS_VALUES);
export type PotentialStatusDto = z.infer<typeof potentialStatusSchema>;

/** `POST /potentials` - `groupId` names the owning Bacenta/Basonta when
 * applicable (optional, mirroring `createOutreachSchema`'s own `groupId`
 * optionality - a Branch-wide referral may have no single owning Group
 * yet). `personId` lets an actor name an already-known Person directly
 * (Phase 1 decision #4's "may also name an existing Person" case) rather
 * than always capturing a fresh name. `notes` deliberately brief - same
 * discipline as `FollowUpTask.description`/`Outreach.notes`. */
export const createPotentialSchema = z.object({
  groupId: z.string().uuid().optional(),
  personId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1, 'firstName is required'),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  source: potentialSourceSchema,
  notes: z.string().trim().min(1).max(500).optional(),
  assignedToPersonId: z.string().uuid().optional(),
});
export type CreatePotentialInput = z.infer<typeof createPotentialSchema>;

/** `PATCH /potentials/:id` - status/notes/assignment triage, plus
 * linking to a Person after the fact (e.g. once promoted or matched to
 * an existing record) - deliberately not a name/source/group edit; those
 * are fixed at creation, matching `updateOutreachContactOutcomeSchema`'s
 * own "narrow, triage-only" precedent. */
export const updatePotentialSchema = z.object({
  status: potentialStatusSchema.optional(),
  notes: z.string().trim().min(1).max(500).optional(),
  assignedToPersonId: z.string().uuid().nullable().optional(),
  personId: z.string().uuid().optional(),
});
export type UpdatePotentialInput = z.infer<typeof updatePotentialSchema>;

export const potentialResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  groupId: z.string().uuid().nullable(),
  personId: z.string().uuid().nullable(),
  firstName: z.string(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  source: potentialSourceSchema,
  status: potentialStatusSchema,
  notes: z.string().nullable(),
  assignedToPersonId: z.string().uuid().nullable(),
  createdByPersonId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PotentialResponseDto = z.infer<typeof potentialResponseSchema>;

/** `GET /potentials` - `groupId` narrows to one Group's own Potentials;
 * omitted falls back to the actor's own scope (own cluster/own group/
 * own Branch), mirroring `listOutreachQuerySchema`'s own shape. */
export const listPotentialsQuerySchema = z.object({
  groupId: z.string().uuid().optional(),
});
export type ListPotentialsQuery = z.infer<typeof listPotentialsQuerySchema>;
