import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { ECCLESIA_RBAC_ACTION_KEY, ECCLESIA_RBAC_DECISION_KEY, ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { RequestWithEcclesiaContext } from '@ecclesia/rbac';
import type { PinoLogger } from 'nestjs-pino';

import type { AuditLogService } from '../audit/audit-log.service';
import type { PrismaService } from '../database/prisma.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

function buildHost(request: { url: string } & Partial<RequestWithEcclesiaContext>): {
  host: ArgumentsHost;
  response: { status: jest.Mock; json: jest.Mock };
} {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

function buildLogger(): PinoLogger {
  return { warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
}

function buildAuditLog(): jest.Mocked<Pick<AuditLogService, 'record' | 'findUserIdByPersonId'>> {
  return {
    record: jest.fn().mockResolvedValue(undefined),
    findUserIdByPersonId: jest.fn().mockResolvedValue('user-1'),
  };
}

function buildPrisma(): jest.Mocked<Pick<PrismaService, 'runInBranchScope'>> {
  return {
    runInBranchScope: jest.fn((_branchId: string | null, fn: () => Promise<unknown>) => fn()),
  } as unknown as jest.Mocked<Pick<PrismaService, 'runInBranchScope'>>;
}

const ecclesiaContext: RequestWithEcclesiaContext[typeof ECCLESIA_REQUEST_CONTEXT_KEY] = {
  actor: { personId: 'p1', role: 'BACENTA_LEADER', branchId: 'b1', bacentaId: 'bacenta-1' },
  resource: { branchId: 'b1', bacentaId: 'bacenta-1' },
  branchConfig: { poimenGateEnabled: false },
};

describe('AllExceptionsFilter', () => {
  it('formats a known HttpException using its own status and message', async () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger, buildAuditLog() as unknown as AuditLogService, buildPrisma() as unknown as PrismaService);
    const { host, response } = buildHost({ url: '/v1/stewardship/transactions/1/verify' });

    await filter.catch(new ForbiddenException('Actor lacks permission for this action'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/v1/stewardship/transactions/1/verify',
        message: 'Actor lacks permission for this action',
      }),
    );
  });

  it('preserves per-field validation issues from BadRequestException', async () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger, buildAuditLog() as unknown as AuditLogService, buildPrisma() as unknown as PrismaService);
    const { host, response } = buildHost({ url: '/v1/people' });

    await filter.catch(new BadRequestException({ message: ['name is required'], issues: [] }), host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST, message: ['name is required'] }),
    );
  });

  it('logs 4xx denials at warn, not error, per engineering-principles.md §5', async () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger, buildAuditLog() as unknown as AuditLogService, buildPrisma() as unknown as PrismaService);
    const { host } = buildHost({ url: '/v1/health' });

    await filter.catch(new ForbiddenException(), host);

    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not leak an unknown internal error message to the client, but does log it at error', async () => {
    const logger = buildLogger();
    const filter = new AllExceptionsFilter(logger, buildAuditLog() as unknown as AuditLogService, buildPrisma() as unknown as PrismaService);
    const { host, response } = buildHost({ url: '/v1/anything' });
    const bug = new Error('database credentials: hunter2');

    await filter.catch(bug, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' }),
    );
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: bug }), 'Unhandled exception');
  });

  describe('RBAC-denial audit write (Audit Log milestone)', () => {
    it('writes a DENY audit row when RbacGuard has stashed a decision, action, and context', async () => {
      const logger = buildLogger();
      const auditLog = buildAuditLog();
      const prisma = buildPrisma();
      const filter = new AllExceptionsFilter(logger, auditLog as unknown as AuditLogService, prisma as unknown as PrismaService);
      const { host } = buildHost({
        url: '/v1/stewardship/transactions/1/verify',
        [ECCLESIA_REQUEST_CONTEXT_KEY]: ecclesiaContext,
        [ECCLESIA_RBAC_ACTION_KEY]: 'stewardship.transaction.verify',
        [ECCLESIA_RBAC_DECISION_KEY]: { effect: 'DENY', reason: "No Role Assignment grants 'stewardship.transaction.verify' to role 'BACENTA_LEADER'" },
      });

      await filter.catch(new ForbiddenException('denied'), host);

      expect(auditLog.findUserIdByPersonId).toHaveBeenCalledWith('p1');
      expect(prisma.runInBranchScope).toHaveBeenCalledWith('b1', expect.any(Function));
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          branchId: 'b1',
          actorUserId: 'user-1',
          action: 'stewardship.transaction.verify',
          effect: 'DENY',
          reason: "No Role Assignment grants 'stewardship.transaction.verify' to role 'BACENTA_LEADER'",
        }),
      );
    });

    it('does not attempt an audit write when no RBAC decision was stashed on the request', async () => {
      const logger = buildLogger();
      const auditLog = buildAuditLog();
      const prisma = buildPrisma();
      const filter = new AllExceptionsFilter(logger, auditLog as unknown as AuditLogService, prisma as unknown as PrismaService);
      const { host } = buildHost({ url: '/v1/anything' });

      await filter.catch(new ForbiddenException('denied'), host);

      expect(auditLog.record).not.toHaveBeenCalled();
    });

    it('does not attempt an audit write for an imperative-authorization denial lacking ECCLESIA_RBAC_DECISION_KEY', async () => {
      const logger = buildLogger();
      const auditLog = buildAuditLog();
      const prisma = buildPrisma();
      const filter = new AllExceptionsFilter(logger, auditLog as unknown as AuditLogService, prisma as unknown as PrismaService);
      const { host } = buildHost({
        url: '/v1/people/role-assignments/1/grant',
        [ECCLESIA_REQUEST_CONTEXT_KEY]: ecclesiaContext,
      });

      await filter.catch(new ForbiddenException('denied imperatively'), host);

      expect(auditLog.record).not.toHaveBeenCalled();
    });

    it('does not attempt an audit write when the decision effect is ALLOW (should be unreachable via a thrown exception, defence in depth)', async () => {
      const logger = buildLogger();
      const auditLog = buildAuditLog();
      const prisma = buildPrisma();
      const filter = new AllExceptionsFilter(logger, auditLog as unknown as AuditLogService, prisma as unknown as PrismaService);
      const { host } = buildHost({
        url: '/v1/anything',
        [ECCLESIA_REQUEST_CONTEXT_KEY]: ecclesiaContext,
        [ECCLESIA_RBAC_ACTION_KEY]: 'gatherings.attendance.create',
        [ECCLESIA_RBAC_DECISION_KEY]: { effect: 'ALLOW', reason: 'granted' },
      });

      await filter.catch(new ForbiddenException('unrelated denial'), host);

      expect(auditLog.record).not.toHaveBeenCalled();
    });

    it('swallows an audit-write failure via logger.warn - the already-sent response is unaffected', async () => {
      const logger = buildLogger();
      const auditLog = buildAuditLog();
      auditLog.record.mockRejectedValue(new Error('connection reset'));
      const prisma = buildPrisma();
      const filter = new AllExceptionsFilter(logger, auditLog as unknown as AuditLogService, prisma as unknown as PrismaService);
      const { host, response } = buildHost({
        url: '/v1/stewardship/transactions/1/verify',
        [ECCLESIA_REQUEST_CONTEXT_KEY]: ecclesiaContext,
        [ECCLESIA_RBAC_ACTION_KEY]: 'stewardship.transaction.verify',
        [ECCLESIA_RBAC_DECISION_KEY]: { effect: 'DENY', reason: 'denied' },
      });

      await expect(filter.catch(new ForbiddenException('denied'), host)).resolves.toBeUndefined();

      expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Failed to write RBAC-denial audit log entry (best-effort, response already sent)',
      );
    });
  });
});
