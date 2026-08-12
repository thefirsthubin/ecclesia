import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import { ECCLESIA_RBAC_ACTION_KEY, ECCLESIA_RBAC_DECISION_KEY, ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { RequestWithEcclesiaContext } from '@ecclesia/rbac';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';

import { AuditLogService } from '../audit/audit-log.service';
import { PrismaService } from '../database/prisma.service';

interface ErrorBody {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
  [key: string]: unknown;
}

type RequestWithRbacContext = Request & RequestWithEcclesiaContext;

/**
 * Workspace-wide exception filter (Sprint 1.2). Every response the API
 * ever sends for an error - a validation failure, an `RbacGuard` denial
 * (Blueprint §9.4), an unexpected bug - passes through here, so the
 * response shape is one thing, not "whatever the throwing code happened
 * to return."
 *
 * Registered as an `APP_FILTER` provider (see `platform.module.ts`)
 * rather than `app.useGlobalFilters()` in `main.ts`, so Nest's DI
 * container can inject the request-scoped pino logger into it - a
 * manually constructed filter in `main.ts` would not get that.
 *
 * engineering-principles.md §5 (Security by Default) states "denials are
 * logged as rigorously as approvals" - every 4xx here logs at `warn`
 * (this includes the 403s `RbacGuard`/`RecordLevelPolicyGuard` will throw
 * once wired to a controller), and every 5xx logs at `error` with the
 * full exception for diagnosis. Nothing that reaches this filter is
 * dropped silently.
 *
 * `[Audit Log milestone]` **This is Blueprint §9.6's own named
 * integration point, not a new one invented for this milestone** - the
 * doc comment above already said "an `RbacGuard` denial" passes through
 * here, and every declaratively-RBAC-gated route's resource-context guard
 * (`EcclesiaContextGuardBase`) unconditionally attaches
 * `ECCLESIA_REQUEST_CONTEXT_KEY`/`ECCLESIA_RBAC_DECISION_KEY`/
 * `ECCLESIA_RBAC_ACTION_KEY` before `RbacGuard` ever throws - so this
 * filter, and only this filter, is the one place every such denial is
 * guaranteed to be observable, with the actor/resource/action/reason
 * already resolved. Writing a real `platform.audit_log` row here (in
 * addition to the existing pino `warn` line, which is the separate,
 * short-retention *operational* log Blueprint §12.1 explicitly
 * distinguishes from this one) is the "single centralized mechanism"
 * this milestone's own instructions call for, not a second competing
 * write path.
 *
 * **Known, bounded limitation, not silently claimed as complete
 * coverage**: the handful of routes using `evaluate()` *imperatively*
 * instead of the declarative `@RequirePermission`/`RbacGuard` pipeline
 * (`RoleAssignmentService.grant()` is the one example in this codebase,
 * per its own doc comment on why) throw their own `ForbiddenException`
 * directly, with no `ECCLESIA_RBAC_DECISION_KEY` ever attached - this
 * filter cannot distinguish that from an ordinary `ForbiddenException`,
 * so those denials are *not* captured by this new write path. Extending
 * coverage to imperative call sites is a separate, per-service change,
 * not something a generic filter can safely infer.
 *
 * **Best-effort, not transactional** - the audit write happens *after*
 * the client-visible response has already been sent, wrapped in its own
 * `try`/`catch` (see `recordRbacDenial`): a failure to write the audit
 * row never changes the actual 403 the client received (RBAC already
 * denied the request independent of whether this succeeds), and is
 * itself logged at `warn` rather than thrown further. This mirrors
 * `AuthGuard`'s own auth-failure write, which makes the identical
 * best-effort tradeoff for the same reason.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name) private readonly logger: PinoLogger,
    private readonly auditLog: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithRbacContext>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = AllExceptionsFilter.resolveMessage(exception, status);

    const body: ErrorBody = {
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception, path: request.url }, 'Unhandled exception');
    } else {
      this.logger.warn({ statusCode: status, path: request.url }, 'Request denied');
    }

    response.status(status).json(body);

    await this.recordRbacDenialIfAny(request);
  }

  private async recordRbacDenialIfAny(request: RequestWithRbacContext): Promise<void> {
    const decision = request[ECCLESIA_RBAC_DECISION_KEY];
    if (!decision || decision.effect !== 'DENY') {
      return;
    }
    const ecclesiaContext = request[ECCLESIA_REQUEST_CONTEXT_KEY];
    const action = request[ECCLESIA_RBAC_ACTION_KEY];
    if (!ecclesiaContext || !action) {
      return;
    }

    try {
      await this.prisma.runInBranchScope(ecclesiaContext.actor.branchId, async () => {
        const actorUserId = await this.auditLog.findUserIdByPersonId(ecclesiaContext.actor.personId);
        await this.auditLog.record({
          branchId: ecclesiaContext.resource.branchId,
          actorUserId,
          action,
          effect: 'DENY',
          reason: decision.reason,
        });
      });
    } catch (auditError) {
      this.logger.warn({ err: auditError }, 'Failed to write RBAC-denial audit log entry (best-effort, response already sent)');
    }
  }

  private static resolveMessage(exception: unknown, status: number): string | string[] {
    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse();
      if (typeof httpResponse === 'string') {
        return httpResponse;
      }
      if (
        typeof httpResponse === 'object' &&
        httpResponse !== null &&
        'message' in httpResponse &&
        (typeof (httpResponse as { message: unknown }).message === 'string' ||
          Array.isArray((httpResponse as { message: unknown }).message))
      ) {
        return (httpResponse as { message: string | string[] }).message;
      }
      return exception.message;
    }
    // Never leak an unknown internal error's message to the client - only
    // the generic reason phrase for the status code.
    return status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : 'Unexpected error';
  }
}
