import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createProjectSchema } from '@ecclesia/contracts';
import type { CreateProjectInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { ProjectCreateResourceContextGuard, ProjectResourceContextGuard } from '../guards/project-resource-context.guard';
import { ProjectService } from '../services/project.service';

/** [INFERRED - no PRD §17.3 row, H2] FR-STW-08. */
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @RequirePermission('stewardship.project.create')
  @UseGuards(ProjectCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createProjectSchema)) body: CreateProjectInput) {
    return this.projectService.create(actor, body);
  }

  @Get(':id')
  @RequirePermission('stewardship.project.read')
  @UseGuards(ProjectResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.projectService.getById(id);
  }
}
