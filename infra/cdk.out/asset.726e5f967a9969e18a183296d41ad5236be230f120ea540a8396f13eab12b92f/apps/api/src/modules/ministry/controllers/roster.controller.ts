import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';

import { RosterResourceContextGuard } from '../guards/roster-resource-context.guard';
import { RosterService } from '../services/roster.service';

/** FR-MIN-01/§16.3's "Basonta roster view" and FR-MIN-04's
 * overcommitment flag. */
@Controller('ministry/groups/:groupId/roster')
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @Get()
  @RequirePermission('ministry.roster.read')
  @UseGuards(RosterResourceContextGuard, RbacGuard)
  listRoster(@Param('groupId') groupId: string) {
    return this.rosterService.listRoster(groupId);
  }

  @Get('overcommitment')
  @RequirePermission('ministry.roster.overcommitment.read')
  @UseGuards(RosterResourceContextGuard, RbacGuard)
  listOvercommitmentFlags(@Param('groupId') groupId: string) {
    return this.rosterService.listOvercommitmentFlags(groupId);
  }
}
