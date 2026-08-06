import { Injectable } from '@nestjs/common';

import { GroupMembershipRepository } from '../repositories/group-membership.repository';

export interface RosterMember {
  personId: string;
  startedAt: Date;
}

/**
 * People's public service interface (Blueprint §7.2) for "who is
 * currently rostered" - extracted for the Ministry milestone, the first
 * cross-module consumer of `GroupMembership` data. Ministry's own
 * `StaffingTargetService` (FR-MIN-03's adequacy ratio) and `RosterService`
 * (FR-MIN-01's roster view, FR-MIN-04's overcommitment flag) need this
 * without reaching into `GroupMembershipRepository`/Prisma directly - the
 * same schema-ownership rule every prior cross-module consumption
 * (`PersonScopeService`, `GroupScopeService`, `GroupLeadershipService`)
 * already follows. "Active"/"rostered" means an open `GroupMembership`
 * (`endedAt IS NULL`), the same definition `GroupMembershipService`
 * itself already uses for BR-PPL-01/02.
 */
@Injectable()
export class GroupRosterService {
  constructor(private readonly groupMembershipRepository: GroupMembershipRepository) {}

  countActiveMembers(groupId: string): Promise<number> {
    return this.groupMembershipRepository.countActiveByGroup(groupId);
  }

  listActiveMembers(groupId: string): Promise<RosterMember[]> {
    return this.groupMembershipRepository.listActiveByGroup(groupId);
  }

  /** FR-MIN-04: how many concurrent active Basonta (MINISTRY-type)
   * memberships this Person currently holds - see
   * `libs/domain/ministry`'s `overcommitment.ts` for what this feeds. */
  countActiveMinistryMembershipsForPerson(personId: string): Promise<number> {
    return this.groupMembershipRepository.countActiveMinistryMembershipsForPerson(personId);
  }
}
