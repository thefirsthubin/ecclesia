import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * The one PrismaClient instance for apps/api (Sprint 1.3). Generated from
 * `db/schema.prisma` - see `db/DESIGN_NOTES.md` for what that schema is
 * and is not yet backed by real Blueprint text.
 *
 * `$connect()`/`$disconnect()` are called explicitly in `onModuleInit`/
 * `onModuleDestroy` rather than left to Prisma's lazy-connect-on-first-query
 * default, so a broken database connection fails the app's startup (and
 * `/health`, once wired) immediately and loudly, not on whatever request
 * happens to be first (engineering-principles.md §5, Security/Reliability
 * by Default - a half-working boot state is worse than a refused one).
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
