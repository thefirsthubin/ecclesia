import type { ActorContext } from '@ecclesia/rbac';

import { DashboardController } from './dashboard.controller';

describe('DashboardController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const pulseScoreService = { computeAndStoreBranchScore: jest.fn(), computeAndStoreGroupScore: jest.fn() };
    const alertService = { listForScope: jest.fn() };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const controller = new DashboardController(pulseScoreService as never, alertService as never, groupScopeService as never);
    return { controller, pulseScoreService, alertService, groupScopeService };
  }

  it('getBranchDashboard() computes the Branch score and lists Branch-scoped alerts for the actor\'s own Branch', async () => {
    const { controller, pulseScoreService, alertService } = buildController();
    pulseScoreService.computeAndStoreBranchScore.mockResolvedValue({ id: 'score-1' });
    alertService.listForScope.mockResolvedValue([{ id: 'alert-1' }]);

    const result = await controller.getBranchDashboard(actor);

    expect(pulseScoreService.computeAndStoreBranchScore).toHaveBeenCalledWith('branch-1');
    expect(alertService.listForScope).toHaveBeenCalledWith('BRANCH', 'branch-1');
    expect(result).toEqual({ branchId: 'branch-1', pulseScore: { id: 'score-1' }, alerts: [{ id: 'alert-1' }] });
  });

  it('getBacentaDashboard() resolves the Group\'s own branchId before computing its score', async () => {
    const { controller, pulseScoreService, alertService, groupScopeService } = buildController();
    groupScopeService.loadResourceContext.mockResolvedValue({ branchId: 'branch-1', bacentaId: 'group-1' });
    pulseScoreService.computeAndStoreGroupScore.mockResolvedValue({ id: 'score-2' });
    alertService.listForScope.mockResolvedValue([]);

    const result = await controller.getBacentaDashboard('group-1');

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('group-1');
    expect(pulseScoreService.computeAndStoreGroupScore).toHaveBeenCalledWith('branch-1', 'group-1');
    expect(alertService.listForScope).toHaveBeenCalledWith('GROUP', 'group-1');
    expect(result).toEqual({ branchId: 'branch-1', groupId: 'group-1', pulseScore: { id: 'score-2' }, alerts: [] });
  });

  it('getClusterDashboard() uses the same single-Bacenta drill-down as getBacentaDashboard()', async () => {
    const { controller, pulseScoreService, groupScopeService, alertService } = buildController();
    groupScopeService.loadResourceContext.mockResolvedValue({ branchId: 'branch-1', bacentaId: 'group-2' });
    pulseScoreService.computeAndStoreGroupScore.mockResolvedValue({ id: 'score-3' });
    alertService.listForScope.mockResolvedValue([]);

    await controller.getClusterDashboard('group-2');

    expect(pulseScoreService.computeAndStoreGroupScore).toHaveBeenCalledWith('branch-1', 'group-2');
  });
});
