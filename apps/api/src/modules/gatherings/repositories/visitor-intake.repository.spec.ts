import { VisitorIntakeRepository } from './visitor-intake.repository';

describe('VisitorIntakeRepository', () => {
  function buildRepository() {
    const prisma = {
      visitorIntakeSubmission: { create: jest.fn() },
    };
    const repository = new VisitorIntakeRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.visitorIntakeSubmission.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.visitorIntakeSubmission.create.mockResolvedValue({ id: 'vis-1' });
    const input = {
      branchId: 'branch-1',
      personId: 'person-1',
      submittedData: { firstName: 'Jane', lastName: 'Doe' },
    };

    const result = await repository.create(input);

    expect(prisma.visitorIntakeSubmission.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'vis-1' });
  });
});
