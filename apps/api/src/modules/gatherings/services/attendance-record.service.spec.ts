import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { AttendanceRecordService } from './attendance-record.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildGathering(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'g-1',
    branchId: 'branch-1',
    ownerGroupId: null,
    seriesId: null,
    type: 'SUNDAY_SERVICE',
    scheduledStart: NOW,
    scheduledEnd: NOW,
    venue: null,
    status: 'SCHEDULED',
    config: null,
    createdByPersonId: 'ap-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ar-1',
    gatheringId: 'g-1',
    personId: 'person-1',
    branchId: 'branch-1',
    status: 'PRESENT',
    recordedByPersonId: 'usher-1',
    recordedAt: NOW,
    ...overrides,
  };
}

describe('AttendanceRecordService', () => {
  const actor: ActorContext = { personId: 'usher-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

  function buildService() {
    const attendanceRecordRepository = {
      upsert: jest.fn(),
      findByGathering: jest.fn(),
      countByGathering: jest.fn(),
      countPresentInWindow: jest.fn(),
    };
    const gatheringRepository = { findById: jest.fn() };
    const eventPublisher = { publish: jest.fn() };
    const service = new AttendanceRecordService(attendanceRecordRepository as never, gatheringRepository as never, eventPublisher as never);
    return { service, attendanceRecordRepository, gatheringRepository, eventPublisher };
  }

  describe('record', () => {
    it('throws NotFoundException when the Gathering does not exist', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(null);

      await expect(service.record(actor, 'missing', { personId: 'person-1', status: 'PRESENT' } as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('upserts the record scoped to the Gathering\'s own branchId, not the actor\'s', async () => {
      const { service, attendanceRecordRepository, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering({ branchId: 'branch-owner' }));
      attendanceRecordRepository.upsert.mockResolvedValue(buildRecord({ branchId: 'branch-owner' }));

      await service.record(actor, 'g-1', { personId: 'person-1', status: 'PRESENT' } as never);

      expect(attendanceRecordRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ gatheringId: 'g-1', personId: 'person-1', branchId: 'branch-owner', recordedByPersonId: 'usher-1' }),
      );
    });

    it('publishes attendance.recorded for a non-Bacenta-Meeting gathering type', async () => {
      const { service, attendanceRecordRepository, gatheringRepository, eventPublisher } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering({ type: 'SUNDAY_SERVICE' }));
      attendanceRecordRepository.upsert.mockResolvedValue(buildRecord());

      await service.record(actor, 'g-1', { personId: 'person-1', status: 'PRESENT' } as never);

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'attendance.recorded',
          branchId: 'branch-1',
          subjectPersonId: 'person-1',
          payload: expect.objectContaining({ gatheringId: 'g-1', gatheringType: 'SUNDAY_SERVICE', status: 'PRESENT' }),
        }),
      );
    });

    it('publishes bacenta_meeting.attendance_recorded for a BACENTA_MEETING gathering type', async () => {
      const { service, attendanceRecordRepository, gatheringRepository, eventPublisher } = buildService();
      gatheringRepository.findById.mockResolvedValue(buildGathering({ type: 'BACENTA_MEETING', ownerGroupId: 'group-1' }));
      attendanceRecordRepository.upsert.mockResolvedValue(buildRecord());

      await service.record(actor, 'g-1', { personId: 'person-1', status: 'PRESENT' } as never);

      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'bacenta_meeting.attendance_recorded', subjectGroupId: 'group-1' }),
      );
    });
  });

  describe('listByGathering', () => {
    it('maps every record returned by the repository', async () => {
      const { service, attendanceRecordRepository } = buildService();
      attendanceRecordRepository.findByGathering.mockResolvedValue([buildRecord()]);

      const result = await service.listByGathering('g-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'ar-1', gatheringId: 'g-1' });
    });
  });

  describe('checkCompleteness', () => {
    it('throws NotFoundException when the Gathering does not exist', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.findById.mockResolvedValue(null);

      await expect(service.checkCompleteness('missing')).rejects.toThrow(NotFoundException);
    });

    it('flags incomplete when no attendance is recorded 48h past scheduledEnd (US-D3 default)', async () => {
      const { service, attendanceRecordRepository, gatheringRepository } = buildService();
      const scheduledEnd = new Date('2026-07-01T00:00:00.000Z');
      gatheringRepository.findById.mockResolvedValue(buildGathering({ scheduledEnd }));
      attendanceRecordRepository.countByGathering.mockResolvedValue(0);

      const result = await service.checkCompleteness('g-1');

      expect(result.incomplete).toBe(true);
    });

    it('is complete when attendance has been recorded, regardless of the window', async () => {
      const { service, attendanceRecordRepository, gatheringRepository } = buildService();
      const scheduledEnd = new Date('2026-07-01T00:00:00.000Z');
      gatheringRepository.findById.mockResolvedValue(buildGathering({ scheduledEnd }));
      attendanceRecordRepository.countByGathering.mockResolvedValue(2);

      const result = await service.checkCompleteness('g-1');

      expect(result.incomplete).toBe(false);
    });
  });

  describe('countPresentInWindow', () => {
    it('delegates directly to attendanceRecordRepository.countPresentInWindow', async () => {
      const { service, attendanceRecordRepository } = buildService();
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-09-01T00:00:00.000Z');
      attendanceRecordRepository.countPresentInWindow.mockResolvedValue(356);

      const result = await service.countPresentInWindow('branch-1', from, to);

      expect(attendanceRecordRepository.countPresentInWindow).toHaveBeenCalledWith('branch-1', from, to);
      expect(result).toBe(356);
    });
  });
});
