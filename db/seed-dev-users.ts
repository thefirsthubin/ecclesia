/**
 * Development Authentication sprint - STEP 4's seeded user roster, made
 * real in the database. Companion to `db/seed.ts` (the organizational
 * skeleton - Tenant/Council/Branches/Configuration) rather than a
 * replacement for it - run `pnpm db:seed` first, then this script,
 * exactly as `DEV_USER_SEEDS`' roster and `DevAuthService`'s own "not
 * seeded yet, run pnpm db:seed:dev" error message both assume.
 *
 * `[Multi-Tenant Foundation, Phase 2]` Substantially widened. For each of
 * the nine `DEV_USER_SEEDS` entries (`apps/api/src/platform/auth/dev-users.ts`,
 * imported via a **relative** path, not the `@ecclesia/*` alias - see that
 * file's own comment on why: this script runs outside the Nx project
 * graph, under plain ts-node, where path-alias resolution isn't
 * guaranteed), this creates a `people.persons` row, a `platform.users`
 * row whose `cognito_sub` is exactly the dev user's `id`, and a real,
 * database-backed `people.role_assignments` row shaped exactly the way
 * `roleAssignmentScopeKindFor()` (`dev-users.ts`) says that role must be
 * shaped: Council-scoped (no `branchId`) for Resident Pastor/Council
 * Administrator/Council Treasurer, Branch-scoped for Branch Pastor/
 * Administrator/Treasurer, own-group (Branch-scoped `RoleAssignment` +
 * `groupId`) for Bacenta/Basonta Leader, platform (a `branchId` present
 * only to satisfy the schema's CHECK constraint, granting no Branch-scoped
 * authority - see that function's own doc comment) for System
 * Administrator.
 *
 * Beyond the nine login personas, this script also builds the realistic
 * River of Life organization they sit inside: 3 Bacentas + 3 Basontas
 * under Headquarters, 2 Bacentas under Asokwa, members, attendance, and
 * financial data for both Branches - specifically so a Council-scoped
 * persona (Resident Pastor/Council Administrator/Council Treasurer) has
 * two genuinely different Branches' worth of real data to see across, and
 * a Branch-scoped persona has real data to be correctly isolated *from*.
 * Non-login leadership positions (Asokwa's own Branch Pastor/
 * Administrator/Treasurer, and every Bacenta/Basonta Leader other than
 * the two the login roster names) are real `Person`+`RoleAssignment` rows
 * with no `User` row - not reachable via the dev-login picker, the same
 * shape every ordinary Member in this file already has.
 *
 * No standalone Usher persona anywhere in this file - the Ushering
 * Basonta's own Basonta Leader (`dev-basonta-leader`) *is* the Head of
 * Ushers; ordinary ushers are Ministry-type `GroupMembership` rows
 * (workers), never their own login.
 *
 * "Areas / Fellowships" beneath a Bacenta are named in this phase's brief
 * as a desired sub-Bacenta structure - `db/schema.prisma` has no such
 * model (`Group.type` is exactly `PASTORAL_CARE` (Bacenta) or `MINISTRY`
 * (Basonta), no further subdivision level - confirmed by reading the
 * schema, not assumed). Not fabricated here; see this phase's own report
 * for the full disclosure.
 *
 * Idempotent (upsert throughout, fixed deterministic UUIDs below) - safe
 * to re-run. Every one of the six pre-Phase-2 dev personas keeps its
 * exact pre-Phase-2 fixture ids (see `DEV_PERSONA_FIXTURE_IDS` below) so
 * a database already seeded under the prior roster converges in place
 * rather than duplicating; the three new personas get fresh, previously
 * unused ids. `dev-usher`'s old fixture ids (112/113/114 under the prior
 * index-derived scheme) are simply no longer referenced by this script -
 * see `dev-users.ts`'s own comment on why that alone is sufficient.
 *
 * Refuses to run when `NODE_ENV=production` - a seeded, password-less
 * login roster has no business existing outside development, the same
 * "impossible to activate accidentally in production" concern
 * `auth-mode.ts` applies to the token verifier itself.
 */
import type { Role as PrismaRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

import { DEV_USER_SEEDS, roleAssignmentScopeKindFor } from '../apps/api/src/platform/auth/dev-users';
import type { DevUserSeed } from '../apps/api/src/platform/auth/dev-users';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------
// Organizational skeleton ids - must match db/seed.ts exactly (that
// script is assumed to have already run; main() verifies both Branches
// exist before doing anything else).
// ---------------------------------------------------------------------
const SEED_COUNCIL_ID = '00000000-0000-0000-0000-000000000001';
const SEED_BRANCH_HQ_ID = '00000000-0000-0000-0000-000000000002';
const SEED_BRANCH_ASOKWA_ID = '00000000-0000-0000-0000-000000000005';

// ---------------------------------------------------------------------
// Basontas (Ministry-type Groups) - Headquarters only, per this phase's
// brief ("It does not need every possible Basonta in this phase" refers
// to Asokwa). `BASONTA_USHERING_ID` reuses the pre-Phase-2 "Example
// Basonta" fixture's id, now given its real name and purpose - the same
// row, not a new one, so `dev-basonta-leader`'s existing membership in it
// carries forward unbroken.
// ---------------------------------------------------------------------
const BASONTA_USHERING_ID = '00000000-0000-0000-0000-000000000050';
const BASONTA_CHOIR_ID = '00000000-0000-0000-0000-000000000051';
const BASONTA_MEDIA_ID = '00000000-0000-0000-0000-000000000052';

// ---------------------------------------------------------------------
// Bacentas (Pastoral-Care-type Groups). Grace/Faith reuse the exact
// fixture ids the Branch Pastor Dashboard sprint already created - Hope
// (Headquarters' third Bacenta) and Unity/Victory (Asokwa's two) are new
// this phase.
// ---------------------------------------------------------------------
const BACENTA_GRACE_ID = '00000000-0000-0000-0000-000000000060';
const BACENTA_FAITH_ID = '00000000-0000-0000-0000-000000000061';
const BACENTA_HOPE_ID = '00000000-0000-0000-0000-000000000062';
const BACENTA_UNITY_ID = '00000000-0000-0000-0000-000000000063';
const BACENTA_VICTORY_ID = '00000000-0000-0000-0000-000000000064';

// ---------------------------------------------------------------------
// Gatherings. SUNDAY_GATHERING_HQ_ID/GRACE_MEETING_GATHERING_ID reuse the
// existing fixture ids; the rest are new this phase.
// ---------------------------------------------------------------------
const SUNDAY_GATHERING_HQ_ID = '00000000-0000-0000-0000-000000000070';
const GRACE_MEETING_GATHERING_ID = '00000000-0000-0000-0000-000000000071';
const HOPE_MEETING_GATHERING_ID = '00000000-0000-0000-0000-000000000072';
const SUNDAY_GATHERING_ASOKWA_ID = '00000000-0000-0000-0000-000000000073';
const UNITY_MEETING_GATHERING_ID = '00000000-0000-0000-0000-000000000074';

// ---------------------------------------------------------------------
// Financial fixtures. GRACE_OFFERING_TRANSACTION_ID reuses the existing
// id. Faith and Victory deliberately get NO offering/meeting (see
// `BACENTAS` below) - the same "not every row looks identical, some
// honestly show 'not recorded'" discipline the original Branch Pastor
// Dashboard sprint fixture established for Faith, now also applied to
// Victory for the same reason on the second Branch.
// ---------------------------------------------------------------------
const GRACE_OFFERING_TRANSACTION_ID = '00000000-0000-0000-0000-000000000080';
const HOPE_OFFERING_TRANSACTION_ID = '00000000-0000-0000-0000-000000000081';
const UNITY_OFFERING_TRANSACTION_ID = '00000000-0000-0000-0000-000000000082';
const HQ_EXPENSE_TRANSACTION_ID = '00000000-0000-0000-0000-000000000085';
const HQ_EXPENSE_ID = '00000000-0000-0000-0000-000000000086';
const HQ_EXPENSE_EVENT_REQUESTED_ID = '00000000-0000-0000-0000-000000000087';
const HQ_EXPENSE_EVENT_PAID_ID = '00000000-0000-0000-0000-000000000088';
const BANK_DEPOSIT_GRACE_ID = '00000000-0000-0000-0000-000000000090';
const BANK_DEPOSIT_UNITY_ID = '00000000-0000-0000-0000-000000000091';

/**
 * Stable per-dev-persona fixture ids, keyed by the persona's own stable
 * `id` (not array position - see `dev-users.ts`'s own comment on why
 * position-derived ids broke the moment this phase reordered/resized the
 * roster). The six pre-Phase-2 personas keep the exact ids the old
 * `fixtureIds(index)` function would have produced for them under the
 * *prior* six/seven-entry array order, so an already-seeded database
 * converges in place; the three new personas get fresh ids continuing
 * the same numbering.
 */
const DEV_PERSONA_FIXTURE_IDS: Record<string, { personId: string; userId: string; roleAssignmentId: string }> = {
  'dev-resident-pastor': {
    personId: '00000000-0000-0000-0000-000000000100',
    userId: '00000000-0000-0000-0000-000000000101',
    roleAssignmentId: '00000000-0000-0000-0000-000000000102',
  },
  'dev-assistant-pastor': {
    personId: '00000000-0000-0000-0000-000000000103',
    userId: '00000000-0000-0000-0000-000000000104',
    roleAssignmentId: '00000000-0000-0000-0000-000000000105',
  },
  'dev-treasurer': {
    personId: '00000000-0000-0000-0000-000000000106',
    userId: '00000000-0000-0000-0000-000000000107',
    roleAssignmentId: '00000000-0000-0000-0000-000000000108',
  },
  'dev-basonta-leader': {
    personId: '00000000-0000-0000-0000-000000000109',
    userId: '00000000-0000-0000-0000-000000000110',
    roleAssignmentId: '00000000-0000-0000-0000-000000000111',
  },
  // 112/113/114 were dev-usher's - deliberately not reused (see this
  // file's own top comment on why leaving them unreferenced is enough).
  'dev-council-administrator': {
    personId: '00000000-0000-0000-0000-000000000115',
    userId: '00000000-0000-0000-0000-000000000116',
    roleAssignmentId: '00000000-0000-0000-0000-000000000117',
  },
  'dev-super-administrator': {
    personId: '00000000-0000-0000-0000-000000000118',
    userId: '00000000-0000-0000-0000-000000000119',
    roleAssignmentId: '00000000-0000-0000-0000-000000000120',
  },
  // New in Phase 2.
  'dev-council-treasurer': {
    personId: '00000000-0000-0000-0000-000000000130',
    userId: '00000000-0000-0000-0000-000000000131',
    roleAssignmentId: '00000000-0000-0000-0000-000000000132',
  },
  'dev-bacenta-leader': {
    personId: '00000000-0000-0000-0000-000000000133',
    userId: '00000000-0000-0000-0000-000000000134',
    roleAssignmentId: '00000000-0000-0000-0000-000000000135',
  },
  'dev-system-administrator': {
    personId: '00000000-0000-0000-0000-000000000136',
    userId: '00000000-0000-0000-0000-000000000137',
    roleAssignmentId: '00000000-0000-0000-0000-000000000138',
  },
};

/**
 * Non-login leadership fixture ids - Asokwa's own Branch Pastor/
 * Administrator/Treasurer, plus every Bacenta/Basonta Leader other than
 * the two the login roster names (Grace's leader is `dev-bacenta-leader`;
 * Ushering's is `dev-basonta-leader`). Real `Person` + `RoleAssignment`
 * rows, deliberately no `User` row - not reachable via the dev-login
 * picker, the same shape every ordinary Member in this file has.
 */
const NON_LOGIN_LEADER_IDS = {
  asokwaBranchPastor: { personId: '00000000-0000-0000-0000-000000000200', roleAssignmentId: '00000000-0000-0000-0000-000000000201' },
  asokwaBranchAdministrator: { personId: '00000000-0000-0000-0000-000000000202', roleAssignmentId: '00000000-0000-0000-0000-000000000203' },
  asokwaBranchTreasurer: { personId: '00000000-0000-0000-0000-000000000204', roleAssignmentId: '00000000-0000-0000-0000-000000000205' },
  faithBacentaLeader: { personId: '00000000-0000-0000-0000-000000000206', roleAssignmentId: '00000000-0000-0000-0000-000000000207' },
  hopeBacentaLeader: { personId: '00000000-0000-0000-0000-000000000208', roleAssignmentId: '00000000-0000-0000-0000-000000000209' },
  unityBacentaLeader: { personId: '00000000-0000-0000-0000-000000000210', roleAssignmentId: '00000000-0000-0000-0000-000000000211' },
  victoryBacentaLeader: { personId: '00000000-0000-0000-0000-000000000212', roleAssignmentId: '00000000-0000-0000-0000-000000000213' },
  choirBasontaLeader: { personId: '00000000-0000-0000-0000-000000000214', roleAssignmentId: '00000000-0000-0000-0000-000000000215' },
  mediaBasontaLeader: { personId: '00000000-0000-0000-0000-000000000216', roleAssignmentId: '00000000-0000-0000-0000-000000000217' },
} as const;

// ---------------------------------------------------------------------
// Bulk-member id generators - widely separated numeric bands so no
// combination of (bacentaSlot/basontaSlot, index) can ever collide with
// another band, even as slot counts grow. Bacenta slots: Grace=0,
// Faith=1, Hope=2, Unity=3, Victory=4. Basonta slots: Ushering=0,
// Choir=1, Media=2.
//
// Grace's own member ids (slot 0) are unchanged from the pre-Phase-2
// fixture (the old formula and this one agree at slot 0) - Faith's
// (slot 1) and beyond are renumbered under this wider, collision-safe
// scheme. Disclosed, low-risk: these were always synthetic placeholder
// Persons with no real-world meaning: a database already seeded under
// the old narrower bands simply ends up with a handful of harmless
// orphaned rows alongside the new ones, not a functional problem.
//
// `[Prisma/Postgres mismatch fix]` No `attendanceRecordId()` generator
// here anymore - `AttendanceRecord` creates no longer supply a synthetic
// `id` at all (see the three `attendanceRecord.upsert` call sites' own
// comments for why: its real uniqueness key is the `gatheringId_personId`
// compound index, and the column has its own `gen_random_uuid()`
// default). A `gatheringSlot`-derived band existed here briefly during
// this fix and was removed once proven unnecessary, not merely unused -
// this session's own live-database run showed a slot-derived id can
// collide with a leftover row from an earlier, differently-buggy run
// even after the bug producing that row is fixed, which a real random
// UUID structurally cannot.
// ---------------------------------------------------------------------
function fixedId(band: number, slot: number, index: number): string {
  const n = band + slot * 1000 + index;
  return `00000000-0000-0000-0000-${n.toString().padStart(12, '0')}`;
}
const bacentaMemberPersonId = (slot: number, i: number) => fixedId(9000, slot, i);
const bacentaMembershipId = (slot: number, i: number) => fixedId(40000, slot, i);
const ministryMemberPersonId = (slot: number, i: number) => fixedId(120000, slot, i);
const ministryMembershipId = (slot: number, i: number) => fixedId(160000, slot, i);

/** The current week's Monday, mid-morning local time (matches
 * `apps/web-admin/.../useBranchPastorDashboardData.ts`'s own
 * `getCurrentWeekBounds()` Monday-start convention) - computed relative
 * to `new Date()` at seed-run time, not a fixed date, so this fixture
 * stays "this week" no matter when `db:seed:dev` actually runs. */
function currentWeekMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  monday.setHours(10, 0, 0, 0);
  return monday;
}

/**
 * `DevUserRole` (`dev-users.ts`) is a hand-matched plain string union, not
 * an import of `@ecclesia/rbac`'s `Role` type - see that file's comment.
 * Prisma's generated `Role` enum (imported here as `PrismaRole`, this
 * script's only Prisma-schema-derived type) has the identical literal
 * values, so this cast is safe by construction, not a guess.
 */
function toPrismaRole(role: string): PrismaRole {
  return role as PrismaRole;
}

interface BacentaSpec {
  id: string;
  slot: number;
  branchId: string;
  name: string;
  meetingSchedule: string;
  meetingLocation: string;
  memberCount: number;
  /** Whether this Bacenta gets its own Meeting Gathering + offering -
   * false for Faith/Victory, the deliberate "not every row looks the
   * same, some honestly show 'not recorded'" fixtures. */
  hasMeetingAndOffering: boolean;
  offeringTransactionId?: string;
  meetingGatheringId?: string;
}

/**
 * Upserts one Bacenta (Group, type PASTORAL_CARE) with `memberCount` real
 * Member Persons + GroupMemberships, and - when `hasMeetingAndOffering`
 * is true - a real completed Meeting Gathering (with most members marked
 * PRESENT) and one VERIFIED offering FinancialTransaction attributed to
 * it (`sourceGroupId`). Returns the created member Person ids, so callers
 * can also mark some of them present at the Branch's own Sunday Service.
 */
async function seedBacenta(spec: BacentaSpec, createdByPersonId: string): Promise<string[]> {
  const group = await prisma.group.upsert({
    where: { id: spec.id },
    update: { name: spec.name },
    create: {
      id: spec.id,
      branchId: spec.branchId,
      type: 'PASTORAL_CARE',
      name: spec.name,
      meetingSchedule: spec.meetingSchedule,
      meetingLocation: spec.meetingLocation,
    },
  });

  const memberIds: string[] = [];
  for (let i = 0; i < spec.memberCount; i += 1) {
    const id = bacentaMemberPersonId(spec.slot, i);
    const person = await prisma.person.upsert({
      where: { id },
      update: {},
      create: {
        id,
        branchId: spec.branchId,
        firstName: `${spec.name.split(' ')[0]} Member`,
        lastName: `${i + 1}`,
        lifecycleStage: 'MEMBER',
      },
    });
    // `[Prisma/Postgres mismatch fix]` NOT a plain `upsert({ where: { id:
    // ... } })` - `people.group_memberships` enforces BR-PPL-01 ("a
    // member belongs to exactly one Bacenta") via a *partial* unique
    // index on `person_id` (`one_active_bacenta_per_person ... WHERE
    // group_type = 'PASTORAL_CARE' AND ended_at IS NULL`), which Prisma
    // cannot target as an upsert `where` clause (it isn't a plain
    // `@unique`). Upserting by this row's own synthetic `id` doesn't
    // protect against that constraint at all: this fix's own live-
    // database run proved it concretely - `bacentaMembershipId`'s id
    // band changed between seed-script versions (see this file's own
    // "Bulk-member id generators" comment), so an already-existing
    // active membership for Grace's original 6 members (real ids from
    // before this rewrite) was invisible to an upsert keyed on the *new*
    // id scheme, and Postgres correctly rejected the resulting duplicate
    // active-membership insert. Querying for the real uniqueness key
    // first, then creating only if truly absent (or repointing if a
    // stale membership targets the wrong group), is correct regardless
    // of how the synthetic id scheme evolves in the future.
    const existingMembership = await prisma.groupMembership.findFirst({
      where: { personId: person.id, groupType: 'PASTORAL_CARE', endedAt: null },
    });
    if (!existingMembership) {
      await prisma.groupMembership.create({
        data: {
          id: bacentaMembershipId(spec.slot, i),
          branchId: spec.branchId,
          personId: person.id,
          groupId: group.id,
          groupType: 'PASTORAL_CARE',
        },
      });
    } else if (existingMembership.groupId !== group.id) {
      await prisma.groupMembership.update({
        where: { id: existingMembership.id },
        data: { groupId: group.id, branchId: spec.branchId },
      });
    }
    memberIds.push(person.id);
  }

  if (spec.hasMeetingAndOffering && spec.meetingGatheringId && spec.offeringTransactionId) {
    const weekMonday = currentWeekMonday();
    const meeting = await prisma.gathering.upsert({
      where: { id: spec.meetingGatheringId },
      update: {},
      create: {
        id: spec.meetingGatheringId,
        branchId: spec.branchId,
        ownerGroupId: group.id,
        type: 'CELL_MEETING',
        scheduledStart: new Date(weekMonday.getTime() + 2 * 24 * 60 * 60 * 1000),
        venue: group.meetingLocation ?? undefined,
        status: 'COMPLETED',
        createdByPersonId,
      },
    });
    const presentCount = Math.max(1, Math.floor(memberIds.length * 0.75));
    for (const personId of memberIds.slice(0, presentCount)) {
      // `[Prisma/Postgres mismatch fix]` No `id:` here - see this file's
      // own comment on the `main()` Sunday-Service loops below for why a
      // synthetic, slot-derived id is both unnecessary (the real
      // uniqueness key is the `gatheringId_personId` compound index
      // already used in `where`) and, this session's own live-database
      // run proved, actively unsafe (a leftover row from an earlier,
      // buggy run can occupy the exact id a later run computes, even
      // after the bug producing it is fixed). `AttendanceRecord.id` has
      // its own `gen_random_uuid()` column default - omitting it here
      // lets Postgres assign a real random UUID on every genuine insert,
      // which can never collide with anything.
      await prisma.attendanceRecord.upsert({
        where: { gatheringId_personId: { gatheringId: meeting.id, personId } },
        update: {},
        create: {
          gatheringId: meeting.id,
          personId,
          branchId: spec.branchId,
          status: 'PRESENT',
          recordedByPersonId: createdByPersonId,
        },
      });
    }

    await prisma.financialTransaction.upsert({
      where: { id: spec.offeringTransactionId },
      update: {},
      create: {
        id: spec.offeringTransactionId,
        branchId: spec.branchId,
        type: 'OFFERING',
        sourceGroupId: group.id,
        channel: 'CASH',
        amountMinor: BigInt(150_00 + spec.slot * 3700),
        currency: 'GHS',
        currentState: 'VERIFIED',
        createdAt: new Date(weekMonday.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return memberIds;
}

interface BasontaSpec {
  id: string;
  slot: number;
  branchId: string;
  name: string;
  category: string;
  workerCount: number;
}

/** Upserts one Basonta (Group, type MINISTRY) with `workerCount` real
 * Worker/ministry-member Persons + MINISTRY-type GroupMemberships.
 * Deliberately does not grant any of them a `RoleAssignment` - "Do NOT
 * create separate roles for Chorister/Usher/Dancer/Photographer/Media
 * worker" (this phase's own brief) - they are plain Members with a
 * Ministry Group membership, exactly like a Bacenta's own Members. */
async function seedBasonta(spec: BasontaSpec): Promise<void> {
  const group = await prisma.group.upsert({
    where: { id: spec.id },
    update: { name: spec.name, category: spec.category },
    create: {
      id: spec.id,
      branchId: spec.branchId,
      type: 'MINISTRY',
      name: spec.name,
      category: spec.category,
    },
  });

  for (let i = 0; i < spec.workerCount; i += 1) {
    const id = ministryMemberPersonId(spec.slot, i);
    const person = await prisma.person.upsert({
      where: { id },
      update: {},
      create: {
        id,
        branchId: spec.branchId,
        firstName: `${spec.name.split(' ')[0]} Worker`,
        lastName: `${i + 1}`,
        lifecycleStage: 'MEMBER',
      },
    });
    await prisma.groupMembership.upsert({
      where: { id: ministryMembershipId(spec.slot, i) },
      update: {},
      create: {
        id: ministryMembershipId(spec.slot, i),
        branchId: spec.branchId,
        personId: person.id,
        groupId: group.id,
        groupType: 'MINISTRY',
      },
    });
  }
}

/** Upserts a non-login leadership Person + RoleAssignment - real
 * organizational data (Asokwa's own Branch Pastor/Administrator/
 * Treasurer, and every Bacenta/Basonta Leader the login roster doesn't
 * name), deliberately with no `platform.users` row, so it never appears
 * in the dev-login picker. */
async function seedNonLoginLeader(params: {
  personId: string;
  roleAssignmentId: string;
  branchId: string;
  role: PrismaRole;
  groupId?: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  const person = await prisma.person.upsert({
    where: { id: params.personId },
    update: {},
    create: {
      id: params.personId,
      branchId: params.branchId,
      firstName: params.firstName,
      lastName: params.lastName,
      lifecycleStage: 'MEMBER',
    },
  });
  await prisma.roleAssignment.upsert({
    where: { id: params.roleAssignmentId },
    update: {},
    create: {
      id: params.roleAssignmentId,
      personId: person.id,
      role: params.role,
      branchId: params.branchId,
      groupId: params.groupId ?? null,
    },
  });
  return person.id;
}

/**
 * `[Multi-Tenant Foundation, Phase 2]` Seeds the nine dev-login personas
 * with the `RoleAssignment` shape `roleAssignmentScopeKindFor()` says
 * each one requires - the one place this script makes that decision,
 * deferring to `dev-users.ts`'s pure function rather than re-deriving it,
 * so the two can never silently disagree. Returns each persona's Person
 * id keyed by its stable `id`, for later steps (attaching Grace/Ushering
 * group leadership, the Expense scenario's requester/approver) to use.
 */
async function seedDevPersonas(): Promise<Map<string, { personId: string; userId: string }>> {
  const personasById = new Map<string, { personId: string; userId: string }>();

  for (const seed of DEV_USER_SEEDS) {
    const ids = DEV_PERSONA_FIXTURE_IDS[seed.id];
    if (!ids) {
      throw new Error(`No fixture ids registered for dev persona "${seed.id}" - add an entry to DEV_PERSONA_FIXTURE_IDS.`);
    }

    // Every seeded Person needs a home Branch regardless of role -
    // Person.branchId is NOT NULL in the schema (identity, not
    // authorization scope - see dev-users.ts's own doc comment on
    // roleAssignmentScopeKindFor). Headquarters for every persona: the
    // brief's own explicit instruction for Council-scoped/platform
    // personas, and simply where every Branch-scoped persona in this
    // roster already belongs.
    const person = await prisma.person.upsert({
      where: { id: ids.personId },
      update: {},
      create: {
        id: ids.personId,
        branchId: SEED_BRANCH_HQ_ID,
        firstName: seed.firstName,
        lastName: seed.lastName,
        email: seed.email,
        lifecycleStage: 'MEMBER',
      },
    });

    await prisma.user.upsert({
      where: { id: ids.userId },
      update: {},
      create: {
        id: ids.userId,
        branchId: SEED_BRANCH_HQ_ID,
        personId: person.id,
        // The fact this equals `seed.id` (not a real Cognito sub) is what
        // makes DevAuthService's issued tokens resolve through the real,
        // unmodified ActorContextResolverService - see that service's own
        // doc comment on Council-scoped resolution.
        cognitoSub: seed.id,
        authMethod: 'EMAIL_PASSWORD',
        email: seed.email,
      },
    });

    const scopeKind = roleAssignmentScopeKindFor(seed.role);
    const roleAssignmentData =
      scopeKind === 'COUNCIL'
        ? { branchId: null, councilId: SEED_COUNCIL_ID }
        : // BRANCH and PLATFORM both carry branchId; PLATFORM's grants no
          // Branch-scoped authority at all (see roleAssignmentScopeKindFor's
          // own doc comment) - the RoleAssignment shape is identical, only
          // the *meaning* differs, and that meaning lives entirely in
          // permission-matrix.ts, not here.
          { branchId: SEED_BRANCH_HQ_ID, councilId: null };

    // `[Prisma/Postgres mismatch fix]` `update` must actually apply
    // `roleAssignmentData` (not stay `{}`) - a real bug this fix's own
    // live-database run surfaced, not a theoretical one: Resident Pastor
    // and Council Administrator were Branch-scoped before the Phase 1
    // RBAC redesign made them Council-scoped, and their RoleAssignment
    // `id`s are deliberately stable across reseeds (see
    // DEV_PERSONA_FIXTURE_IDS's own comment) - so on a database seeded
    // before that redesign, `update: {}` would silently leave the old
    // Branch-scoped row in place forever, never converging to the
    // now-correct Council-scoped shape. `role` is included too, on the
    // same "a persona's shape can legitimately change between seed-script
    // versions, and a re-run must converge it" principle, even though no
    // current persona actually changes role.
    await prisma.roleAssignment.upsert({
      where: { id: ids.roleAssignmentId },
      update: { role: toPrismaRole(seed.role), ...roleAssignmentData },
      create: {
        id: ids.roleAssignmentId,
        personId: person.id,
        role: toPrismaRole(seed.role),
        ...roleAssignmentData,
      },
    });

    personasById.set(seed.id, { personId: person.id, userId: ids.userId });

    // eslint-disable-next-line no-console
    console.log(`Seeded development user "${seed.label}" (${seed.id}, ${scopeKind}) -> Person ${person.id}`);
  }

  return personasById;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'db:seed:dev refuses to run when NODE_ENV=production - this seeds a password-less development login ' +
        'roster, which must never exist outside a development database. See DEVELOPMENT_AUTHENTICATION_GUIDE.md.',
    );
  }

  const [headquarters, asokwa] = await Promise.all([
    prisma.branch.findUnique({ where: { id: SEED_BRANCH_HQ_ID } }),
    prisma.branch.findUnique({ where: { id: SEED_BRANCH_ASOKWA_ID } }),
  ]);
  if (!headquarters || !asokwa) {
    throw new Error('Seeded Branches do not exist yet - run "pnpm db:seed" before "pnpm db:seed:dev".');
  }

  // --- Dev-login personas first, so their Person/User ids exist for the
  // organizational fixtures below (Gathering.createdByPersonId, Expense
  // requester/approver, Bacenta/Basonta leadership) to reference. ---
  const personas = await seedDevPersonas();
  const branchPastor = personas.get('dev-assistant-pastor');
  const branchTreasurer = personas.get('dev-treasurer');
  const residentPastor = personas.get('dev-resident-pastor');
  const bacentaLeader = personas.get('dev-bacenta-leader');
  const basontaLeader = personas.get('dev-basonta-leader');
  if (!branchPastor || !branchTreasurer || !residentPastor || !bacentaLeader || !basontaLeader) {
    throw new Error('One or more required dev personas are missing from DEV_USER_SEEDS - cannot seed the surrounding organization.');
  }

  // --- Basontas (Headquarters only) ---
  await seedBasonta({ id: BASONTA_USHERING_ID, slot: 0, branchId: SEED_BRANCH_HQ_ID, name: 'Ushering', category: 'Hospitality', workerCount: 5 });
  await seedBasonta({ id: BASONTA_CHOIR_ID, slot: 1, branchId: SEED_BRANCH_HQ_ID, name: 'Choir', category: 'Worship', workerCount: 6 });
  await seedBasonta({ id: BASONTA_MEDIA_ID, slot: 2, branchId: SEED_BRANCH_HQ_ID, name: 'Media & Technical', category: 'Production', workerCount: 4 });

  // `dev-basonta-leader` is the Head of Ushers - attach its RoleAssignment
  // to the Ushering Basonta specifically (this phase's explicit
  // requirement: "The Head of Ushers must be BASONTA_LEADER associated
  // with Ushering Basonta").
  await prisma.roleAssignment.update({
    where: { id: DEV_PERSONA_FIXTURE_IDS['dev-basonta-leader'].roleAssignmentId },
    data: { groupId: BASONTA_USHERING_ID },
  });

  // Choir and Media get their own real (non-login) leaders.
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.choirBasontaLeader,
    branchId: SEED_BRANCH_HQ_ID,
    role: 'BASONTA_LEADER',
    groupId: BASONTA_CHOIR_ID,
    firstName: 'Choir',
    lastName: 'Leader',
  });
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.mediaBasontaLeader,
    branchId: SEED_BRANCH_HQ_ID,
    role: 'BASONTA_LEADER',
    groupId: BASONTA_MEDIA_ID,
    firstName: 'Media & Technical',
    lastName: 'Leader',
  });

  // --- Bacentas: Headquarters (Grace, Faith, Hope) ---
  const graceMembers = await seedBacenta(
    {
      id: BACENTA_GRACE_ID,
      slot: 0,
      branchId: SEED_BRANCH_HQ_ID,
      name: 'Grace Bacenta',
      meetingSchedule: 'Wednesdays, 6:30 PM',
      meetingLocation: 'Fellowship Hall',
      memberCount: 10,
      hasMeetingAndOffering: true,
      offeringTransactionId: GRACE_OFFERING_TRANSACTION_ID,
      meetingGatheringId: GRACE_MEETING_GATHERING_ID,
    },
    branchPastor.personId,
  );
  const faithMembers = await seedBacenta(
    {
      id: BACENTA_FAITH_ID,
      slot: 1,
      branchId: SEED_BRANCH_HQ_ID,
      name: 'Faith Bacenta',
      meetingSchedule: 'Thursdays, 6:30 PM',
      meetingLocation: 'Room 2',
      memberCount: 8,
      // Deliberately no meeting/offering this week - see this file's own
      // top comment on why.
      hasMeetingAndOffering: false,
    },
    branchPastor.personId,
  );
  const hopeMembers = await seedBacenta(
    {
      id: BACENTA_HOPE_ID,
      slot: 2,
      branchId: SEED_BRANCH_HQ_ID,
      name: 'Hope Bacenta',
      meetingSchedule: 'Fridays, 6:00 PM',
      meetingLocation: 'Room 3',
      memberCount: 7,
      hasMeetingAndOffering: true,
      offeringTransactionId: HOPE_OFFERING_TRANSACTION_ID,
      meetingGatheringId: HOPE_MEETING_GATHERING_ID,
    },
    branchPastor.personId,
  );

  // Grace's leader is the login persona; Faith and Hope get real,
  // non-login leaders.
  await prisma.roleAssignment.update({
    where: { id: DEV_PERSONA_FIXTURE_IDS['dev-bacenta-leader'].roleAssignmentId },
    data: { groupId: BACENTA_GRACE_ID },
  });
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.faithBacentaLeader,
    branchId: SEED_BRANCH_HQ_ID,
    role: 'BACENTA_LEADER',
    groupId: BACENTA_FAITH_ID,
    firstName: 'Faith Bacenta',
    lastName: 'Leader',
  });
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.hopeBacentaLeader,
    branchId: SEED_BRANCH_HQ_ID,
    role: 'BACENTA_LEADER',
    groupId: BACENTA_HOPE_ID,
    firstName: 'Hope Bacenta',
    lastName: 'Leader',
  });

  // Branch Pastor's cluster covers all three Headquarters Bacentas -
  // `RoleAssignment.scopeGroupIds` (not `groupId`) is what
  // `ActorContextResolverService` reads into `ActorContext.clusterBacentaIds`.
  await prisma.roleAssignment.update({
    where: { id: DEV_PERSONA_FIXTURE_IDS['dev-assistant-pastor'].roleAssignmentId },
    data: { scopeGroupIds: [BACENTA_GRACE_ID, BACENTA_FAITH_ID, BACENTA_HOPE_ID] },
  });

  // --- Bacentas: Asokwa (Unity, Victory) ---
  const asokwaBranchPastorPersonId = await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.asokwaBranchPastor,
    branchId: SEED_BRANCH_ASOKWA_ID,
    role: 'ASSISTANT_PASTOR',
    firstName: 'Asokwa Branch',
    lastName: 'Pastor',
  });
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.asokwaBranchAdministrator,
    branchId: SEED_BRANCH_ASOKWA_ID,
    role: 'ADMIN',
    firstName: 'Asokwa Branch',
    lastName: 'Administrator',
  });
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.asokwaBranchTreasurer,
    branchId: SEED_BRANCH_ASOKWA_ID,
    role: 'TREASURER',
    firstName: 'Asokwa Branch',
    lastName: 'Treasurer',
  });

  const unityMembers = await seedBacenta(
    {
      id: BACENTA_UNITY_ID,
      slot: 3,
      branchId: SEED_BRANCH_ASOKWA_ID,
      name: 'Unity Bacenta',
      meetingSchedule: 'Tuesdays, 6:30 PM',
      meetingLocation: 'Asokwa Hall A',
      memberCount: 9,
      hasMeetingAndOffering: true,
      offeringTransactionId: UNITY_OFFERING_TRANSACTION_ID,
      meetingGatheringId: UNITY_MEETING_GATHERING_ID,
    },
    asokwaBranchPastorPersonId,
  );
  const victoryMembers = await seedBacenta(
    {
      id: BACENTA_VICTORY_ID,
      slot: 4,
      branchId: SEED_BRANCH_ASOKWA_ID,
      name: 'Victory Bacenta',
      meetingSchedule: 'Saturdays, 4:00 PM',
      meetingLocation: 'Asokwa Hall B',
      memberCount: 6,
      hasMeetingAndOffering: false,
    },
    asokwaBranchPastorPersonId,
  );
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.unityBacentaLeader,
    branchId: SEED_BRANCH_ASOKWA_ID,
    role: 'BACENTA_LEADER',
    groupId: BACENTA_UNITY_ID,
    firstName: 'Unity Bacenta',
    lastName: 'Leader',
  });
  await seedNonLoginLeader({
    ...NON_LOGIN_LEADER_IDS.victoryBacentaLeader,
    branchId: SEED_BRANCH_ASOKWA_ID,
    role: 'BACENTA_LEADER',
    groupId: BACENTA_VICTORY_ID,
    firstName: 'Victory Bacenta',
    lastName: 'Leader',
  });

  // --- Branch-wide Sunday Service, both Branches - real attendance so
  // Branch Pastor / Bacenta Leader dashboards have something to show. ---
  const weekMonday = currentWeekMonday();
  const sundayHq = await prisma.gathering.upsert({
    where: { id: SUNDAY_GATHERING_HQ_ID },
    update: {},
    create: {
      id: SUNDAY_GATHERING_HQ_ID,
      branchId: SEED_BRANCH_HQ_ID,
      ownerGroupId: null,
      type: 'SUNDAY_SERVICE',
      scheduledStart: new Date(weekMonday.getTime() + 6 * 24 * 60 * 60 * 1000),
      venue: 'Main Auditorium',
      status: 'COMPLETED',
      createdByPersonId: branchPastor.personId,
    },
  });
  // `[Prisma/Postgres mismatch fix]` No synthetic `id:` in these `create`
  // blocks either - see `seedBacenta`'s own comment on why: the real
  // uniqueness key is `gatheringId_personId` (already used in `where`),
  // and `AttendanceRecord.id` has its own `gen_random_uuid()` default.
  const hqSundayPresent = [...graceMembers.slice(0, 8), ...faithMembers.slice(0, 6), ...hopeMembers.slice(0, 5)];
  for (const personId of hqSundayPresent) {
    await prisma.attendanceRecord.upsert({
      where: { gatheringId_personId: { gatheringId: sundayHq.id, personId } },
      update: {},
      create: {
        gatheringId: sundayHq.id,
        personId,
        branchId: SEED_BRANCH_HQ_ID,
        status: 'PRESENT',
        recordedByPersonId: branchPastor.personId,
      },
    });
  }

  const sundayAsokwa = await prisma.gathering.upsert({
    where: { id: SUNDAY_GATHERING_ASOKWA_ID },
    update: {},
    create: {
      id: SUNDAY_GATHERING_ASOKWA_ID,
      branchId: SEED_BRANCH_ASOKWA_ID,
      ownerGroupId: null,
      type: 'SUNDAY_SERVICE',
      scheduledStart: new Date(weekMonday.getTime() + 6 * 24 * 60 * 60 * 1000),
      venue: 'Asokwa Main Hall',
      status: 'COMPLETED',
      createdByPersonId: asokwaBranchPastorPersonId,
    },
  });
  const asokwaSundayPresent = [...unityMembers.slice(0, 7), ...victoryMembers.slice(0, 4)];
  for (const personId of asokwaSundayPresent) {
    await prisma.attendanceRecord.upsert({
      where: { gatheringId_personId: { gatheringId: sundayAsokwa.id, personId } },
      update: {},
      create: {
        gatheringId: sundayAsokwa.id,
        personId,
        branchId: SEED_BRANCH_ASOKWA_ID,
        status: 'PRESENT',
        recordedByPersonId: asokwaBranchPastorPersonId,
      },
    });
  }

  // --- Bank deposit confirmations (Headquarters' Grace, Asokwa's Unity)
  // - the weekly reconciliation view Branch/Council Treasurer read. ---
  await prisma.bankDepositConfirmation.upsert({
    where: { groupId_weekStartDate: { groupId: BACENTA_GRACE_ID, weekStartDate: weekMonday } },
    update: {},
    create: {
      id: BANK_DEPOSIT_GRACE_ID,
      branchId: SEED_BRANCH_HQ_ID,
      groupId: BACENTA_GRACE_ID,
      weekStartDate: weekMonday,
      depositedAmountMinor: 150_00n,
      currency: 'GHS',
      bankReference: 'DEV-SEED-GRACE-001',
      confirmedByPersonId: branchTreasurer.personId,
    },
  });
  await prisma.bankDepositConfirmation.upsert({
    where: { groupId_weekStartDate: { groupId: BACENTA_UNITY_ID, weekStartDate: weekMonday } },
    update: {},
    create: {
      id: BANK_DEPOSIT_UNITY_ID,
      branchId: SEED_BRANCH_ASOKWA_ID,
      groupId: BACENTA_UNITY_ID,
      weekStartDate: weekMonday,
      depositedAmountMinor: 465_00n,
      currency: 'GHS',
      bankReference: 'DEV-SEED-UNITY-001',
      confirmedByPersonId: branchTreasurer.personId,
    },
  });

  // --- One realistic Expense scenario at Headquarters: Branch Treasurer
  // requests, Resident Pastor approves, marked PAID (receipt not yet
  // retained) - gives Branch/Council Treasurer portals a real non-offering
  // financial record, and a real approver != requester pair (FR-STW-09). ---
  await prisma.financialTransaction.upsert({
    where: { id: HQ_EXPENSE_TRANSACTION_ID },
    update: {},
    create: {
      id: HQ_EXPENSE_TRANSACTION_ID,
      branchId: SEED_BRANCH_HQ_ID,
      type: 'EXPENSE',
      channel: null,
      amountMinor: 850_00n,
      currency: 'GHS',
      currentState: 'PAID',
      createdAt: weekMonday,
    },
  });
  await prisma.expense.upsert({
    where: { id: HQ_EXPENSE_ID },
    update: {},
    create: {
      id: HQ_EXPENSE_ID,
      branchId: SEED_BRANCH_HQ_ID,
      transactionId: HQ_EXPENSE_TRANSACTION_ID,
      requestedByPersonId: branchTreasurer.personId,
      description: 'Sound system repair (seed data - not a real expense)',
      category: 'Facilities',
      approvedByPersonId: residentPastor.personId,
      approvedAt: new Date(weekMonday.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.financialTransactionEvent.upsert({
    where: { id: HQ_EXPENSE_EVENT_REQUESTED_ID },
    update: {},
    create: {
      id: HQ_EXPENSE_EVENT_REQUESTED_ID,
      transactionId: HQ_EXPENSE_TRANSACTION_ID,
      fromState: null,
      toState: 'REQUESTED',
      actorUserId: branchTreasurer.userId,
      occurredAt: weekMonday,
    },
  });
  await prisma.financialTransactionEvent.upsert({
    where: { id: HQ_EXPENSE_EVENT_PAID_ID },
    update: {},
    create: {
      id: HQ_EXPENSE_EVENT_PAID_ID,
      transactionId: HQ_EXPENSE_TRANSACTION_ID,
      fromState: 'APPROVED',
      toState: 'PAID',
      actorUserId: branchTreasurer.userId,
      reason: 'Paid via Mobile Money to vendor',
      occurredAt: new Date(weekMonday.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded River of Life organization: Headquarters (Grace/Faith/Hope Bacentas, Ushering/Choir/Media Basontas) ` +
      `and Asokwa Branch (Unity/Victory Bacentas), plus attendance, offerings, a bank deposit per Branch, and one Expense.`,
  );
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
