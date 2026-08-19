import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { getOutreachConversionQuerySchema } from '@ecclesia/contracts';
import type { GetOutreachConversionQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { OutreachConversionResourceContextGuard } from '../guards/outreach-conversion-resource-context.guard';
import { OutreachConversionService } from '../services/outreach-conversion.service';

/** `[Milestone C.1.2: Outreach Analytics]` See
 * `OutreachConversionService`'s own doc comment for the full design. */
@Controller('insights')
export class OutreachConversionController {
  constructor(private readonly outreachConversionService: OutreachConversionService) {}

  @Get('outreach-conversion')
  @RequirePermission('outreach.contact.read')
  @UseGuards(OutreachConversionResourceContextGuard, RbacGuard)
  getConversion(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(getOutreachConversionQuerySchema)) query: GetOutreachConversionQuery,
  ) {
    return this.outreachConversionService.getConversion(actor, query);
  }
}
