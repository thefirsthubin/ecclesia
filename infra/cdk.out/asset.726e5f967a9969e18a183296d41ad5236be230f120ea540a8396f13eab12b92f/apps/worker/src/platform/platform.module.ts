import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

import { validateEnv } from './config/env.schema';
import type { EnvConfig } from './config/env.schema';
import { WorkerDatabaseModule } from './database/database.module';

/**
 * `WorkerPlatformModule` (Worker milestone) - apps/worker's own analogue
 * of `apps/api/src/platform/platform.module.ts`, deliberately smaller:
 *
 * - `ConfigModule`/`LoggerModule`/`WorkerDatabaseModule` are carried over
 *   unchanged in spirit (typed env, structured pino logging, Prisma).
 * - `TerminusModule`/`HealthController` are dropped - apps/worker has no
 *   HTTP surface (it runs via `NestFactory.createApplicationContext()`),
 *   so there is no `/health` route to back.
 * - `AllExceptionsFilter` (`APP_FILTER`) is dropped - that filter's job is
 *   translating thrown errors into HTTP responses; a Worker command that
 *   throws should propagate the error to its caller (`main.ts`'s
 *   dispatcher) and exit non-zero, not format an HTTP body nobody reads.
 * - `AuditModule`/`AuthModule`/`RbacPlatformModule` are dropped entirely,
 *   not merely deferred. Worker-initiated writes bypass HTTP+RBAC guards
 *   by construction (see `WORKER_DESIGN_NOTES.md`'s "No system actor"
 *   section) - there is no `ActorContext` to resolve and no per-request
 *   authorization decision to audit-log here the way apps/api has one for
 *   every human-initiated request.
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
          // Same "pretty locally, structured JSON everywhere else"
          // reasoning as apps/api's PlatformModule - no `autoLogging`
          // ignore rule is needed here since apps/worker has no HTTP
          // requests to auto-log in the first place.
          transport:
            configService.get('NODE_ENV', { infer: true }) === 'development'
              ? { target: 'pino-pretty', options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
    WorkerDatabaseModule,
  ],
  exports: [ConfigModule, WorkerDatabaseModule],
})
export class WorkerPlatformModule {}
