import { Injectable } from '@nestjs/common';
import { evaluateOvercommitment } from '@ecclesia/domain-ministry';
import type { OvercommitmentFlagResponseDto, RosterMemberResponseDto } from '@ecclesia/contracts';

import { GroupRosterService } from '../../people/services/group-roster.service';

/**
 * FR-MIN-01/§16.3's "Basonta roster view" and FR-MIN-04's overcommitment
 * flag - both read-only views built on top of People's exported
 * `GroupRosterService`, not a new roster-membership mechanism of
 * Ministry's own (roster add/remove already happens through People's
 * `GroupMembershipService`, unchanged - see `MINISTRY_DESIGN_NOTES.md`).
 */
@Injectable()
export class RosterService {
  constructor(private readonly groupRosterService: GroupRosterService) {}

  async listRoster(groupId: string): Promise<RosterMemberResponseDto[]> {
    const members = await this.groupRosterService.listActiveMembers(groupId);
    return members.map((member) => ({ personId: member.personId, startedAt: member.startedAt.toISOString() }));
  }

  /** Only the flagged (overcommitted) members are returned - this
   * endpoint *is* the flag list, not a full roster status report. See
   * `libs/domain/ministry`'s `overcommitment.ts` for what
   * "overcommitted" measures here. */
  async listOvercommitmentFlags(groupId: string): Promise<OvercommitmentFlagResponseDto[]> {
    const members = await this.groupRosterService.listActiveMembers(groupId);
    const flags: OvercommitmentFlagResponseDto[] = [];
    for (const member of members) {
      const concurrentCount = await this.groupRosterService.countActiveMinistryMembershipsForPerson(member.personId);
      const evaluation = evaluateOvercommitment(concurrentCount);
      if (evaluation.overcommitted) {
        flags.push({
          personId: member.personId,
          concurrentCommitmentCount: evaluation.concurrentCommitmentCount,
          threshold: evaluation.threshold,
          overcommitted: true,
        });
      }
    }
    return flags;
  }
}
