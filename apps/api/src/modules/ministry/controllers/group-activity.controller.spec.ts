import { GroupActivityController } from './group-activity.controller';

describe('[Post-Milestone D — Portal Experiences follow-up] GroupActivityController', () => {
  function buildController() {
    const groupActivityService = { getActivity: jest.fn() };
    const controller = new GroupActivityController(groupActivityService as never);
    return { controller, groupActivityService };
  }

  it('getActivity() delegates to GroupActivityService.getActivity with the groupId and parsed from/to Dates', async () => {
    const { controller, groupActivityService } = buildController();

    await controller.getActivity('basonta-1', { from: '2026-08-01T00:00:00.000Z', to: '2026-08-31T00:00:00.000Z' });

    expect(groupActivityService.getActivity).toHaveBeenCalledWith(
      'basonta-1',
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z'),
    );
  });
});
