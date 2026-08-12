import { AuditLogService } from './audit-log.service';
import type { PrismaService } from '../database/prisma.service';

describe('AuditLogService', () => {
  it('writes every provided field through to platform.audit_log', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const prisma = { auditLog: { create } } as unknown as PrismaService;
    const service = new AuditLogService(prisma);

    await service.record({
      branchId: 'branch-1',
      actorUserId: 'user-1',
      action: 'auth.token.verify',
      effect: 'DENY',
      resourceType: 'session',
      resourceId: 'session-1',
      reason: 'Token expired',
      deviceId: 'device-1',
      ipAddress: '203.0.113.1',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        actorUserId: 'user-1',
        action: 'auth.token.verify',
        effect: 'DENY',
        resourceType: 'session',
        resourceId: 'session-1',
        reason: 'Token expired',
        deviceId: 'device-1',
        ipAddress: '203.0.113.1',
      },
    });
  });

  it('writes undefined fields through as-is (Prisma treats undefined as "omit")', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const prisma = { auditLog: { create } } as unknown as PrismaService;
    const service = new AuditLogService(prisma);

    await service.record({ action: 'auth.token.verify', effect: 'DENY' });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'auth.token.verify', effect: 'DENY', branchId: undefined }),
    });
  });

  describe('findUserIdByPersonId', () => {
    it("resolves a platform.users id from the actor's personId", async () => {
      const findUnique = jest.fn().mockResolvedValue({ id: 'user-1' });
      const prisma = { user: { findUnique } } as unknown as PrismaService;
      const service = new AuditLogService(prisma);

      const result = await service.findUserIdByPersonId('person-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { personId: 'person-1' }, select: { id: true } });
      expect(result).toBe('user-1');
    });

    it('returns undefined when no platform.users row is linked to this personId', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { user: { findUnique } } as unknown as PrismaService;
      const service = new AuditLogService(prisma);

      const result = await service.findUserIdByPersonId('person-with-no-user');

      expect(result).toBeUndefined();
    });
  });
});
