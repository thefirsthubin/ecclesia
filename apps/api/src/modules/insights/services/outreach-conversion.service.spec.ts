import type { ActorContext } from '@ecclesia/rbac';

import { OutreachConversionService } from './outreach-conversion.service';

describe('[Milestone C.1.2] OutreachConversionService', () => {
  function buildService() {
    const outreachService = { countByBranch: jest.fn().mockResolvedValue(0), countByGroups: jest.fn().mockResolvedValue(0) };
    const outreachContactService = { listForConversion: jest.fn().mockResolvedValue([]) };
    const personService = { getByIds: jest.fn().mockResolvedValue([]), findIdsByBranchAndLifecycleStage: jest.fn().mockResolvedValue([]) };
    const attendanceRecordService = { listDistinctPresentPersonIds: jest.fn().mockResolvedValue([]) };
    const gatheringTypeCategoryService = { typesForCategory: jest.fn().mockResolvedValue(['SUNDAY_SERVICE']) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const service = new OutreachConversionService(
      outreachService as never,
      outreachContactService as never,
      personService as never,
      attendanceRecordService as never,
      gatheringTypeCategoryService as never,
      prisma as never,
    );
    return { service, outreachService, outreachContactService, personService, attendanceRecordService, gatheringTypeCategoryService, prisma };
  }

  const branchActor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
  const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
  const assistantPastor: ActorContext = {
    personId: 'ap-1',
    role: 'ASSISTANT_PASTOR',
    branchId: 'branch-1',
    clusterBacentaIds: ['bacenta-1', 'bacenta-2'],
  };

  describe('scope resolution', () => {
    it('uses countByBranch/listForConversion(undefined groupIds) for a BRANCH-scoped actor with no groupId', async () => {
      const { service, outreachService, outreachContactService } = buildService();

      await service.getConversion(branchActor, { council: false } as never);

      expect(outreachService.countByBranch).toHaveBeenCalledWith('branch-1', undefined, undefined);
      expect(outreachService.countByGroups).not.toHaveBeenCalled();
      expect(outreachContactService.listForConversion).toHaveBeenCalledWith('branch-1', undefined, undefined, undefined);
    });

    it('uses countByGroups([bacentaId]) for an OWN_GROUP-scoped actor with no groupId query param', async () => {
      const { service, outreachService, outreachContactService } = buildService();

      await service.getConversion(bacentaLeader, { council: false } as never);

      expect(outreachService.countByGroups).toHaveBeenCalledWith(['bacenta-1'], undefined, undefined);
      expect(outreachContactService.listForConversion).toHaveBeenCalledWith('branch-1', ['bacenta-1'], undefined, undefined);
    });

    it('uses countByGroups(clusterBacentaIds) for a CLUSTER-scoped actor with no groupId query param', async () => {
      const { service, outreachService } = buildService();

      await service.getConversion(assistantPastor, { council: false } as never);

      expect(outreachService.countByGroups).toHaveBeenCalledWith(['bacenta-1', 'bacenta-2'], undefined, undefined);
    });

    it('drills down to a single groupId when query.groupId is given, regardless of actor scope', async () => {
      const { service, outreachService } = buildService();

      await service.getConversion(branchActor, { council: false, groupId: 'bacenta-9' } as never);

      expect(outreachService.countByGroups).toHaveBeenCalledWith(['bacenta-9'], undefined, undefined);
    });

    it('parses from/to into Dates and passes them through', async () => {
      const { service, outreachService } = buildService();
      const from = '2026-08-01T00:00:00.000Z';
      const to = '2026-08-31T00:00:00.000Z';

      await service.getConversion(branchActor, { council: false, from, to } as never);

      expect(outreachService.countByBranch).toHaveBeenCalledWith('branch-1', new Date(from), new Date(to));
    });
  });

  describe('council aggregation', () => {
    it('loops runInBranchScope over councilBranchIds and returns a councilBranches array', async () => {
      const { service, prisma } = buildService();
      const residentPastor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1', councilBranchIds: ['branch-1', 'branch-2'] };

      const result = await service.getConversion(residentPastor, { council: true } as never);

      expect(prisma.runInBranchScope).toHaveBeenCalledTimes(2);
      expect('councilBranches' in result).toBe(true);
      if (!('councilBranches' in result)) throw new Error('expected a council result');
      expect(result.councilBranches.map((b) => b.branchId)).toEqual(['branch-1', 'branch-2']);
    });

    it('rejects a Council-scoped request from an actor with no councilBranchIds', async () => {
      const { service } = buildService();

      await expect(service.getConversion(branchActor, { council: true } as never)).rejects.toThrow();
    });

    it('rejects supplying both council and groupId', async () => {
      const { service } = buildService();

      await expect(service.getConversion(branchActor, { council: true, groupId: 'bacenta-1' } as never)).rejects.toThrow();
    });
  });

  describe('conversion math', () => {
    it('computes contactsReachedCount/promotedContactsCount/conversionPercentage from listForConversion rows', async () => {
      const { service, outreachContactService } = buildService();
      outreachContactService.listForConversion.mockResolvedValue([
        { id: 'c1', personId: 'p1', createdAt: new Date('2026-08-01T00:00:00.000Z') },
        { id: 'c2', personId: null, createdAt: new Date('2026-08-02T00:00:00.000Z') },
        { id: 'c3', personId: null, createdAt: new Date('2026-08-03T00:00:00.000Z') },
        { id: 'c4', personId: null, createdAt: new Date('2026-08-04T00:00:00.000Z') },
      ]);

      const result = await service.getConversion(branchActor, { council: false } as never);

      expect('contactsReachedCount' in result).toBe(true);
      if (!('contactsReachedCount' in result)) throw new Error('expected a single-branch result');
      expect(result.contactsReachedCount).toBe(4);
      expect(result.promotedContactsCount).toBe(1);
      expect(result.conversionPercentage).toBe(25);
    });

    it('reports 0 conversionPercentage rather than dividing by zero when contactsReachedCount is 0', async () => {
      const { service } = buildService();

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('conversionPercentage' in result)) throw new Error('expected a single-branch result');
      expect(result.conversionPercentage).toBe(0);
    });

    it('always sets averageInferredPromotionDaysIsInferred: true', async () => {
      const { service } = buildService();

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('averageInferredPromotionDaysIsInferred' in result)) throw new Error('expected a single-branch result');
      expect(result.averageInferredPromotionDaysIsInferred).toBe(true);
    });

    it('computes averageInferredPromotionDays as Person.createdAt - contact.createdAt in days, for promoted contacts only', async () => {
      const { service, outreachContactService, personService } = buildService();
      outreachContactService.listForConversion.mockResolvedValue([
        { id: 'c1', personId: 'p1', createdAt: new Date('2026-08-01T00:00:00.000Z') },
      ]);
      personService.getByIds.mockResolvedValue([{ id: 'p1', createdAt: new Date('2026-08-06T00:00:00.000Z') }]);

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('averageInferredPromotionDays' in result)) throw new Error('expected a single-branch result');
      expect(result.averageInferredPromotionDays).toBe(5);
    });

    it('reports null averageInferredPromotionDays when there are no promoted contacts', async () => {
      const { service } = buildService();

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('averageInferredPromotionDays' in result)) throw new Error('expected a single-branch result');
      expect(result.averageInferredPromotionDays).toBeNull();
    });

    it('clamps a negative inferred duration to 0 rather than reporting a negative number of days', async () => {
      const { service, outreachContactService, personService } = buildService();
      outreachContactService.listForConversion.mockResolvedValue([
        { id: 'c1', personId: 'p1', createdAt: new Date('2026-08-10T00:00:00.000Z') },
      ]);
      personService.getByIds.mockResolvedValue([{ id: 'p1', createdAt: new Date('2026-08-01T00:00:00.000Z') }]);

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('averageInferredPromotionDays' in result)) throw new Error('expected a single-branch result');
      expect(result.averageInferredPromotionDays).toBe(0);
    });
  });

  describe('convertedToActiveMemberCount', () => {
    it('is 0, with no active-member lookups, when there are no promoted contacts', async () => {
      const { service, personService, gatheringTypeCategoryService } = buildService();

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('convertedToActiveMemberCount' in result)) throw new Error('expected a single-branch result');
      expect(result.convertedToActiveMemberCount).toBe(0);
      expect(personService.findIdsByBranchAndLifecycleStage).not.toHaveBeenCalled();
      expect(gatheringTypeCategoryService.typesForCategory).not.toHaveBeenCalled();
    });

    it('is 0 when no SUNDAY-category gathering types are configured, without guessing', async () => {
      const { service, outreachContactService, gatheringTypeCategoryService, attendanceRecordService } = buildService();
      outreachContactService.listForConversion.mockResolvedValue([
        { id: 'c1', personId: 'p1', createdAt: new Date('2026-08-01T00:00:00.000Z') },
      ]);
      gatheringTypeCategoryService.typesForCategory.mockResolvedValue([]);

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('convertedToActiveMemberCount' in result)) throw new Error('expected a single-branch result');
      expect(result.convertedToActiveMemberCount).toBe(0);
      expect(attendanceRecordService.listDistinctPresentPersonIds).not.toHaveBeenCalled();
    });

    it('counts a promoted contact as converted only when the person is both MEMBER-stage and recently present at a SUNDAY-category gathering', async () => {
      const { service, outreachContactService, personService, gatheringTypeCategoryService, attendanceRecordService } = buildService();
      outreachContactService.listForConversion.mockResolvedValue([
        { id: 'c1', personId: 'p1', createdAt: new Date('2026-08-01T00:00:00.000Z') },
        { id: 'c2', personId: 'p2', createdAt: new Date('2026-08-01T00:00:00.000Z') },
      ]);
      personService.getByIds.mockResolvedValue([
        { id: 'p1', createdAt: new Date('2026-08-02T00:00:00.000Z') },
        { id: 'p2', createdAt: new Date('2026-08-02T00:00:00.000Z') },
      ]);
      personService.findIdsByBranchAndLifecycleStage.mockResolvedValue(['p1', 'p2']);
      gatheringTypeCategoryService.typesForCategory.mockResolvedValue(['SUNDAY_SERVICE']);
      attendanceRecordService.listDistinctPresentPersonIds.mockResolvedValue(['p1']);

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('convertedToActiveMemberCount' in result)) throw new Error('expected a single-branch result');
      expect(result.convertedToActiveMemberCount).toBe(1);
      expect(result.convertedToActiveMemberPercentage).toBe(50);
    });

    it('excludes a promoted contact whose person is not MEMBER-stage even if recently present', async () => {
      const { service, outreachContactService, personService, gatheringTypeCategoryService, attendanceRecordService } = buildService();
      outreachContactService.listForConversion.mockResolvedValue([
        { id: 'c1', personId: 'p1', createdAt: new Date('2026-08-01T00:00:00.000Z') },
      ]);
      personService.getByIds.mockResolvedValue([{ id: 'p1', createdAt: new Date('2026-08-02T00:00:00.000Z') }]);
      personService.findIdsByBranchAndLifecycleStage.mockResolvedValue([]);
      gatheringTypeCategoryService.typesForCategory.mockResolvedValue(['SUNDAY_SERVICE']);
      attendanceRecordService.listDistinctPresentPersonIds.mockResolvedValue(['p1']);

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('convertedToActiveMemberCount' in result)) throw new Error('expected a single-branch result');
      expect(result.convertedToActiveMemberCount).toBe(0);
      expect(attendanceRecordService.listDistinctPresentPersonIds).not.toHaveBeenCalled();
    });

    it('reports 0 convertedToActiveMemberPercentage rather than dividing by zero when promotedContactsCount is 0', async () => {
      const { service } = buildService();

      const result = await service.getConversion(branchActor, { council: false } as never);

      if (!('convertedToActiveMemberPercentage' in result)) throw new Error('expected a single-branch result');
      expect(result.convertedToActiveMemberPercentage).toBe(0);
    });
  });
});
