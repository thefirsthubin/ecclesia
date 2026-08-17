import { DevAuthController } from './dev-auth.controller';
import type { DevAuthService } from '../dev-auth.service';
import { DEV_USER_SEEDS } from '../dev-users';

function serviceStub(): jest.Mocked<Pick<DevAuthService, 'listAvailableUsers' | 'issueTokenFor'>> {
  return {
    listAvailableUsers: jest.fn(),
    issueTokenFor: jest.fn(),
  };
}

describe('DevAuthController', () => {
  it('GET /auth/dev/users returns only id/label/role/context, not the seed email/firstName/lastName', async () => {
    const service = serviceStub();
    service.listAvailableUsers.mockResolvedValue([DEV_USER_SEEDS[0]]);
    const controller = new DevAuthController(service as unknown as DevAuthService);

    const result = await controller.listUsers();

    expect(result).toEqual([{ id: DEV_USER_SEEDS[0].id, label: DEV_USER_SEEDS[0].label, role: DEV_USER_SEEDS[0].role }]);
  });

  /**
   * `[Multi-Tenant Foundation, Phase 2]` `context` (the optional
   * secondary Branch/Bacenta/Basonta label) passed through verbatim -
   * uses `dev-bacenta-leader`, a persona that actually has one
   * (`DEV_USER_SEEDS[0]`, `dev-resident-pastor`, deliberately does not,
   * per `dev-users.ts`'s own doc comment - Council-scoped personas have
   * no single Branch/group to name this way).
   */
  it('GET /auth/dev/users passes through a persona\'s context label when it has one', async () => {
    const service = serviceStub();
    const bacentaLeader = DEV_USER_SEEDS.find((seed) => seed.id === 'dev-bacenta-leader');
    if (!bacentaLeader) throw new Error('dev-bacenta-leader missing from DEV_USER_SEEDS');
    service.listAvailableUsers.mockResolvedValue([bacentaLeader]);
    const controller = new DevAuthController(service as unknown as DevAuthService);

    const result = await controller.listUsers();

    expect(result).toEqual([{ id: bacentaLeader.id, label: bacentaLeader.label, role: bacentaLeader.role, context: 'Grace Bacenta' }]);
  });

  it('POST /auth/dev/login delegates straight to DevAuthService.issueTokenFor', async () => {
    const service = serviceStub();
    service.issueTokenFor.mockResolvedValue({ accessToken: 'token-123', expiresIn: 43200 });
    const controller = new DevAuthController(service as unknown as DevAuthService);

    const result = await controller.login({ devUserId: 'dev-resident-pastor' });

    expect(service.issueTokenFor).toHaveBeenCalledWith('dev-resident-pastor');
    expect(result).toEqual({ accessToken: 'token-123', expiresIn: 43200 });
  });
});
