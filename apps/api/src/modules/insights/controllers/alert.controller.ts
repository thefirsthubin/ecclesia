import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { resolveAlertSchema } from '@ecclesia/contracts';
import type { ResolveAlertInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { AlertResourceContextGuard } from '../guards/alert-resource-context.guard';
import { AlertService } from '../services/alert.service';

/**
 * `GET/PATCH /insights/alerts/:id` (FR-INS-03/05). Single-Alert
 * read/resolve - the scoped-by-dashboard alert lists (branch/bacenta/
 * cluster) already serve the "inbox" browsing surface; this controller
 * is for acting on one specific alert once a leader has found it there.
 */
@Controller('insights/alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get(':id')
  @RequirePermission('insights.alert.read')
  @UseGuards(AlertResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.alertService.getById(id);
  }

  @Patch(':id/resolve')
  @RequirePermission('insights.alert.resolve')
  @UseGuards(AlertResourceContextGuard, RbacGuard)
  resolve(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resolveAlertSchema)) body: ResolveAlertInput,
  ) {
    return this.alertService.resolve(actor.personId, id, body);
  }
}
