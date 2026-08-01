import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ActorContextResolverService } from './actor-context-resolver.service';
import { AuthGuard } from './auth.guard';
import { CognitoVerifierService } from './cognito-verifier.service';

/**
 * Wires Cognito JWT verification + `ActorContext` resolution (Sprint 1.4)
 * as a global guard, so every route requires a verified identity by
 * default (opt out via `@Public()`) rather than requiring each future
 * domain controller to remember `@UseGuards(AuthGuard)` individually -
 * the same "secure by default, not by convention" reasoning already
 * applied to `AllExceptionsFilter`'s `APP_FILTER` registration.
 */
@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [
    CognitoVerifierService,
    ActorContextResolverService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [CognitoVerifierService, ActorContextResolverService],
})
export class AuthModule {}
