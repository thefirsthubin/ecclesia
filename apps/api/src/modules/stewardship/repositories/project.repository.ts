import { Injectable } from '@nestjs/common';
import type { Project } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateProjectRecord {
  branchId: string;
  name: string;
  description?: string;
  targetAmountMinor: bigint;
  currency: string;
  createdByPersonId: string;
}

/** Prisma-backed persistence for `stewardship.projects` (FR-STW-08/H2). */
@Injectable()
export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateProjectRecord): Promise<Project> {
    return this.prisma.project.create({ data: input });
  }

  findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }
}
