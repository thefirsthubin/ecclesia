import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * The one PrismaClient instance for apps/worker - a second, independent
 * instance from apps/api's own `PrismaService`, both generated from the
 * same `db/schema.prisma` (Blueprint ADR-003: one shared Postgres database
 * behind separate services, not a shared ORM client). See
 * `apps/api/src/platform/database/prisma.service.ts`'s doc comment for why
 * `$connect()`/`$disconnect()` are called explicitly rather than left to
 * Prisma's lazy-connect default - identical reasoning applies here: a
 * Worker process that cannot reach the database should fail its startup
 * loudly, not fail confusingly on whatever the first job/message happens
 * to be.
 *
 * Deliberately not a shared `libs/database` import - no such lib exists in
 * this workspace, and Nx's `enforce-module-boundaries` rule forbids one
 * app importing another app's code directly; this is apps/worker's own
 * copy of the same small, already-established pattern, not a workaround.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectPinoLogger(PrismaService.name) private readonly logger: PinoLogger) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.info('Prisma connected to the database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.info('Prisma disconnected from the database');
  }
}
