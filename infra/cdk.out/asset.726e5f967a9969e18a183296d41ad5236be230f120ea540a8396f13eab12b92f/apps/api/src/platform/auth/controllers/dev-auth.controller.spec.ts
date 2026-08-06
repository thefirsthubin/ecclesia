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
  it('GET /auth/dev/users returns only id/label/role, not the seed email/firstName/lastName', async () => {
    const service = serviceStub();
    service.listAvailableUsers.mockResolvedValue([DEV_USER_SEEDS[0]]);
    const controller = new DevAuthController(service as unknown as DevAuthService);

    const result = await controller.listUsers();

    expect(result).toEqual([{ id: DEV_USER_SEEDS[0].id, label: DEV_USER_SEEDS[0].label, role: DEV_USER_SEEDS[0].role }]);
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
