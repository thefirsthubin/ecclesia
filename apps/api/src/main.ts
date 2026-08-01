/**
 * Entry point for the Ecclesia API service (Blueprint Ch.1 §3: the
 * modular monolith exposing one NestJS module per bounded context).
 *
 * Sprint 1.2 adds the platform foundation - typed/validated config,
 * structured logging, URI-path API versioning (Blueprint §14.7), Swagger,
 * and workspace-wide exception handling (see `app/app.module.ts`'s
 * `PlatformModule` import). No bounded-context (people, stewardship, ...)
 * modules, database connection, or authentication exist yet - those are
 * Sprints 1.3/1.4 and the People domain milestone that follows.
 */
import 'reflect-metadata';

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app/app.module';
import type { EnvConfig } from './platform/config/env.schema';

async function bootstrap() {
  // `bufferLogs: true` holds Nest's own bootstrap log lines until the real
  // pino logger below is attached, so nothing is lost or logged twice
  // through two different loggers during startup.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const configService = app.get<ConfigService<EnvConfig, true>>(ConfigService);

  // Blueprint §14.7: every business endpoint is versioned from the first
  // one, at the path level (`/v1/...`), not left unversioned "until it
  // matters" - `HealthController` opts out via `VERSION_NEUTRAL` since it
  // is an infrastructure endpoint, not a client-facing one.
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const docsEnabled = configService.get('API_DOCS_ENABLED', { infer: true });
  if (docsEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Ecclesia API')
      .setDescription('Ecclesia Church Operating System API (Blueprint Ch.1 §3). Sprint 1.2: platform foundation only.')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Ecclesia API listening on port ${port} (docs: ${docsEnabled ? '/docs' : 'disabled'})`);
}

bootstrap().catch((error: unknown) => {
  // The pino logger may not exist yet if bootstrap failed before
  // `NestFactory.create` resolved (e.g. invalid environment config) -
  // console.error is the only guaranteed-available fallback here. No
  // eslint-disable needed: the workspace `no-console` rule explicitly
  // allows `console.error` (eslint.config.cjs).
  console.error('[api] Fatal error during bootstrap', error);
  process.exitCode = 1;
});
