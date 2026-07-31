/**
 * Entry point for the Ecclesia API service (Blueprint Ch.1 §3: the
 * modular monolith exposing one NestJS module per bounded context).
 *
 * This Sprint 0 milestone deliberately boots a bare application with no
 * domain modules registered yet (see AppModule) - no business logic, no
 * database connection, no authentication. Its only job is to prove the
 * NestJS/webpack/Nx wiring produces a real, runnable service.
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[api] Ecclesia API listening on port ${port} (scaffold - no domain modules registered yet)`);
}

bootstrap();
