import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { DevAuthService } from './dev-auth.service';
import { DEV_USER_SEEDS } from './dev-users';
import type { PrismaRootService } from '../database/prisma-root.service';

function prismaStub(): jest.Mocked<Pick<PrismaRootService, 'user'>> {
  return {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as jest.Mocked<Pick<PrismaRootService, 'user'>>;
}

describe('DevAuthService', () => {
  describe('listAvailableUsers', () => {
    it('returns only the seeded personas that actually have a platform.users row', async () => {
      const prisma = prismaStub();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { cognitoSub: 'dev-resident-pastor' },
        { cognitoSub: 'dev-treasurer' },
      ]);
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      const users = await service.listAvailableUsers();

      expect(users.map((u) => u.id).sort()).toEqual(['dev-resident-pastor', 'dev-treasurer'].sort());
    });

    it('returns an empty list when nothing has been seeded yet', async () => {
      const prisma = prismaStub();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      await expect(service.listAvailableUsers()).resolves.toEqual([]);
    });
  });

  describe('issueTokenFor', () => {
    it('rejects an id that is not one of DEV_USER_SEEDS', async () => {
      const prisma = prismaStub();
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      await expect(service.issueTokenFor('not-a-real-dev-user')).rejects.toThrow(NotFoundException);
    });

    it('rejects a known seed id that has not been seeded into the database yet', async () => {
      const prisma = prismaStub();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      await expect(service.issueTokenFor('dev-resident-pastor')).rejects.toThrow(/not seeded yet/);
    });

    it('issues a token for a seeded persona', async () => {
      const prisma = prismaStub();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', cognitoSub: 'dev-resident-pastor' });
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      const result = await service.issueTokenFor('dev-resident-pastor');

      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.split('.')).toHaveLength(2);
      expect(result.expiresIn).toBe(12 * 60 * 60);
    });
  });

  describe('verifyAccessToken', () => {
    async function issuedToken(): Promise<string> {
      const prisma = prismaStub();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1', cognitoSub: 'dev-resident-pastor' });
      const service = new DevAuthService(prisma as unknown as PrismaRootService);
      const { accessToken } = await service.issueTokenFor('dev-resident-pastor');
      return accessToken;
    }

    it('round-trips a freshly issued token back to its sub claim', async () => {
      const prisma = prismaStub();
      const service = new DevAuthService(prisma as unknown as PrismaRootService);
      const token = await issuedToken();

      await expect(service.verifyAccessToken(token)).resolves.toEqual({ sub: 'dev-resident-pastor' });
    });

    it('rejects a malformed token with no signature segment', async () => {
      const prisma = prismaStub();
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      await expect(service.verifyAccessToken('not-a-real-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a token whose signature has been tampered with', async () => {
      const prisma = prismaStub();
      const service = new DevAuthService(prisma as unknown as PrismaRootService);
      const token = await issuedToken();
      const [body] = token.split('.');
      const tampered = `${body}.not-the-real-signature`;

      await expect(service.verifyAccessToken(tampered)).rejects.toThrow(/Invalid development token signature/);
    });

    it('rejects a token once its 12-hour TTL has elapsed', async () => {
      const token = await issuedToken();
      const prisma = prismaStub();
      const service = new DevAuthService(prisma as unknown as PrismaRootService);

      const realNow = Date.now();
      const thirteenHoursLater = realNow + 13 * 60 * 60 * 1000;
      jest.spyOn(Date, 'now').mockReturnValue(thirteenHoursLater);
      try {
        await expect(service.verifyAccessToken(token)).rejects.toThrow(/Development token has expired/);
      } finally {
        jest.spyOn(Date, 'now').mockRestore();
      }
    });

    it('round-trips a token for every seeded persona, not just one', async () => {
      const prisma = prismaStub();
      const service = new DevAuthService(prisma as unknown as PrismaRootService);
      for (const seed of DEV_USER_SEEDS) {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-x', cognitoSub: seed.id });
        const { accessToken } = await service.issueTokenFor(seed.id);
        await expect(service.verifyAccessToken(accessToken)).resolves.toEqual({ sub: seed.id });
      }
    });
  });
});
