import { Injectable } from '@nestjs/common';

import { RoleAssignmentRepository } from '../repositories/role-assignment.repository';

/**
 * People's public service interface (Blueprint §7.2) for "who currently
 * leads this Bacenta?" - the one Role Assignment lookup another bounded
 * -context module needs without reaching into
 * `people.role_assignments`/`RoleAssignmentRepository` directly. First
 * consumer: Gatherings' `VisitorIntakeService`, resolving US-A2's "Bacenta
 * preference... Follow-up task defaults to the matching Shepherd."
 * Deliberately narrow (one method, wrapping
 * `RoleAssignmentRepository.findActiveBacentaLeader` - the same lookup
 * `RoleAssignmentService.grant()`'s own succession logic already uses)
 * rather than exporting `RoleAssignmentRepository` itself, per the
 * schema-ownership rule.
 */
@Injectable()
export class GroupLeadershipService {
  constructor(private readonly roleAssignmentRepository: RoleAssignmentRepository) {}

  async getActiveBacentaLeaderPersonId(groupId: string, now: Date = new Date()): Promise<string | undefined> {
    const assignment = await this.roleAssignmentRepository.findActiveBacentaLeader(groupId, now);
    return assignment?.personId;
  }
}
