import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';

import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.schema';
import type { EnvConfig } from './config/env.schema';
import { DatabaseModule } from './database/database.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HealthController } from './health/health.controller';
import { RbacPlatformModule } from './rbac/rbac-platform.module';

/**
 * PlatformModule (Sprint 1.2) - the module named but not yet built in
 * `apps/api/src/app/app.module.ts`'s bounded-context list and in
 * `apps/api/README.md`. Everything here is cross-cutting infrastructure
 * (config, logging, health, error handling), never business logic per
 * engineering-principles.md §1 - no PRD requirement is implemented by
 * this module, it exists to let every other bounded-context module be
 * built safely on top of it.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => ({
        pinoHttp: {
          level: configService.get('LOG_LEVEL', { infer: true }),
          // Pretty-printed, human-readable logs locally; structured JSON
          // (pino's default) everywhere else, since that is what a log
          // aggregator in the eventual ECS deployment (Blueprint §11.1)
          // actually needs to index and query.
          transport:
            configService.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
          // Never log credentials or session tokens, even by accident via
          // a header dump - engineering-principles.md §5, Security by
          // Default.
          redact: {
            paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
            remove: true,
          },
          autoLogging: {
            // The infra health check would otherwise dominate the log
            // stream with a line every few seconds.
            ignore: (req) => req.url === '/health',
          },
        },
      }),
    }),
    TerminusModule,
    DatabaseModule,
    AuditModule,
    // Development Authentication sprint: `AuthModule` is now a dynamic
    // module (`@Module({})` + `static register()`) so its
    // providers/controllers can differ by `AUTH_MODE` - see that file's
    // own comment for why this couldn't be a plain `useFactory` provider
    // instead. `.register()` re-computes and validates the mode via
    // `assertAuthModeIsSafe` each time it's called.
    AuthModule.register(),
    RbacPlatformModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  // Re-exporting a dynamic module: Nest matches by module class regardless
  // of the dynamic config it was imported with, so `AuthModule` (the plain
  // class) is correct here even though `imports` above used
  // `AuthModule.register()`.
  exports: [ConfigModule, DatabaseModule, AuditModule, AuthModule, RbacPlatformModule],
})
export class PlatformModule {}
