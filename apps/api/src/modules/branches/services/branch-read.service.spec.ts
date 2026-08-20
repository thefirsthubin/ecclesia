import { BadRequestException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import type { BranchReadRepository } from '../repositories/branch-read.repository';
import { BranchReadService } from './branch-read.service';

describe('BranchReadService', () => {
  function buildService() {
    const repository = { findById: jest.fn() } as unknown as jest.Mocked<BranchReadRepository>;
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new BranchReadService(repository, prisma as never);
    return { service, repository, prisma };
  }

  it("lists every real Branch in the actor's Council, one runInBranchScope call per Branch", async () => {
    const { service, repository, prisma } = buildService();
    (repository.findById as jest.Mock).mockImplementation((branchId: string) => Promise.resolve({ id: branchId, name: `Branch ${branchId}` }));
    const actor: ActorContext = { personId: 'overseer-1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };

    const result = await service.listForActor(actor);

    expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
    expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(1, 'branch-1', expect.any(Function));
    expect(prisma.runInBranchScope).toHaveBeenNthCalledWith(2, 'branch-2', expect.any(Function));
    expect(result).toEqual([
      { id: 'branch-1', name: 'Branch branch-1' },
      { id: 'branch-2', name: 'Branch branch-2' },
    ]);
  });

  it('rejects with a BadRequestException when the actor has no Council scope', async () => {
    const { service } = buildService();
    const actor: ActorContext = { personId: 'p1', role: 'ADMIN', branchId: 'branch-1' };

    await expect(service.listForActor(actor)).rejects.toThrow(BadRequestException);
  });

  it('rejects with a BadRequestException when councilBranchIds is an empty array', async () => {
    const { service } = buildService();
    const actor: ActorContext = { personId: 'p1', role: 'COUNCIL_OVERSEER', branchId: 'branch-1', councilBranchIds: [] };

    await expect(service.listForActor(actor)).rejects.toThrow(BadRequestException);
  });
});
