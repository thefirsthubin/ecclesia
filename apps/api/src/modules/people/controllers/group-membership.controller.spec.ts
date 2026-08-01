import { GroupMembershipController } from './group-membership.controller';

describe('GroupMembershipController', () => {
  it('assign() delegates to GroupMembershipService.assign with the personId param', async () => {
    const groupMembershipService = { assign: jest.fn() };
    const controller = new GroupMembershipController(groupMembershipService as never);
    const body = { groupId: '11111111-1111-1111-1111-111111111111' } as never;

    await controller.assign('person-1', body);

    expect(groupMembershipService.assign).toHaveBeenCalledWith('person-1', body);
  });
});
