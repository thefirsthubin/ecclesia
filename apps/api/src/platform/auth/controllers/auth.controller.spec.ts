import type { ActorContext } from '@ecclesia/rbac';
import type { ConfigService } from '@nestjs/config';

import type { EnvConfig } from '../../config/env.schema';
import { AuthController } from './auth.controller';

function configServiceStub(mode: EnvConfig['AUTH_MODE']): ConfigService<EnvConfig, true> {
  return {
    get: jest.fn(() => mode),
  } as unknown as ConfigService<EnvConfig, true>;
}

describe('AuthController', () => {
  it('returns exactly the ActorContext @CurrentActor() supplies, unmodified', () => {
    const controller = new AuthController(configServiceStub('cognito'));
    const actor: ActorContext = {
      personId: 'person-1',
      role: 'RESIDENT_PASTOR',
      branchId: 'branch-1',
    };

    expect(controller.getCurrentActor(actor)).toBe(actor);
  });

  it('passes through optional scope fields (bacentaId/basontaId/clusterBacentaIds) when present', () => {
    const controller = new AuthController(configServiceStub('cognito'));
    const actor: ActorContext = {
      personId: 'person-2',
      role: 'ASSISTANT_PASTOR',
      branchId: 'branch-1',
      clusterBacentaIds: ['group-1', 'group-2'],
    };

    expect(controller.getCurrentActor(actor)).toEqual(actor);
  });

  // Development Authentication sprint (STEP 6).
  describe('getAuthMode', () => {
    it('returns the effective AUTH_MODE read from ConfigService, unmodified', () => {
      const controller = new AuthController(configServiceStub('cognito'));
      expect(controller.getAuthMode()).toEqual({ mode: 'cognito' });
    });

    it('returns development when the resolved config says so', () => {
      const controller = new AuthController(configServiceStub('development'));
      expect(controller.getAuthMode()).toEqual({ mode: 'development' });
    });
  });
});
