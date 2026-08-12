import type { ActorContext } from '@ecclesia/rbac';
import type { ConfigService } from '@nestjs/config';

import type { EnvConfig } from '../../config/env.schema';
import type { PrismaService } from '../../database/prisma.service';
import { AuthController } from './auth.controller';

function configServiceStub(mode: EnvConfig['AUTH_MODE']): ConfigService<EnvConfig, true> {
  return {
    get: jest.fn(() => mode),
  } as unknown as ConfigService<EnvConfig, true>;
}

function prismaStub(branchName: string): PrismaService {
  return {
    branch: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({ name: branchName }),
    },
  } as unknown as PrismaService;
}

describe('AuthController', () => {
  describe('getCurrentActor', () => {
    it('returns the ActorContext @CurrentActor() supplies, plus the real Branch name looked up by branchId', async () => {
      const prisma = prismaStub('Grace Chapel');
      const controller = new AuthController(configServiceStub('cognito'), prisma);
      const actor: ActorContext = {
        personId: 'person-1',
        role: 'RESIDENT_PASTOR',
        branchId: 'branch-1',
      };

      await expect(controller.getCurrentActor(actor)).resolves.toEqual({ ...actor, branchName: 'Grace Chapel' });
      expect(prisma.branch.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'branch-1' }, select: { name: true } });
    });

    it('passes through optional scope fields (bacentaId/basontaId/clusterBacentaIds) when present', async () => {
      const prisma = prismaStub('Grace Chapel');
      const controller = new AuthController(configServiceStub('cognito'), prisma);
      const actor: ActorContext = {
        personId: 'person-2',
        role: 'ASSISTANT_PASTOR',
        branchId: 'branch-1',
        clusterBacentaIds: ['group-1', 'group-2'],
      };

      await expect(controller.getCurrentActor(actor)).resolves.toEqual({ ...actor, branchName: 'Grace Chapel' });
    });

    it('resolves branchName using this actor\'s own branchId, not any other request field', async () => {
      const prisma = prismaStub('Second Branch Church');
      const controller = new AuthController(configServiceStub('cognito'), prisma);
      const actor: ActorContext = { personId: 'person-3', role: 'ADMIN', branchId: 'branch-2' };

      const result = await controller.getCurrentActor(actor);

      expect(result.branchName).toBe('Second Branch Church');
      expect(prisma.branch.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'branch-2' }, select: { name: true } });
    });
  });

  // Development Authentication sprint (STEP 6).
  describe('getAuthMode', () => {
    it('returns the effective AUTH_MODE read from ConfigService, unmodified', () => {
      const controller = new AuthController(configServiceStub('cognito'), prismaStub('n/a'));
      expect(controller.getAuthMode()).toEqual({ mode: 'cognito' });
    });

    it('returns development when the resolved config says so', () => {
      const controller = new AuthController(configServiceStub('development'), prismaStub('n/a'));
      expect(controller.getAuthMode()).toEqual({ mode: 'development' });
    });
  });
});
