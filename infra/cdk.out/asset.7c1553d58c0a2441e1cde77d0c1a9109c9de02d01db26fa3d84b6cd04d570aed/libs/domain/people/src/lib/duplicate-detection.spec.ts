import { findDuplicateCandidates } from './duplicate-detection';
import type { DuplicateCandidateRecord } from './duplicate-detection';

describe('duplicate-detection (FR-PPL-02)', () => {
  const now = new Date('2026-08-01T00:00:00Z');

  it('matches on name + phone regardless of casing/whitespace', () => {
    const candidates: DuplicateCandidateRecord[] = [
      { id: 'p1', firstName: '  Ama ', lastName: 'Owusu', phone: '+233555000111' },
    ];
    const matches = findDuplicateCandidates(
      { firstName: 'ama', lastName: '  OWUSU', phone: '+233555000111' },
      candidates,
      now,
    );
    expect(matches).toEqual([
      { candidateId: 'p1', matchedOn: 'NAME_AND_PHONE', reason: expect.stringContaining('FR-PPL-02') },
    ]);
  });

  it('does not match on phone alone without a matching name', () => {
    const candidates: DuplicateCandidateRecord[] = [
      { id: 'p1', firstName: 'Kwabena', lastName: 'Mensah', phone: '+233555000111' },
    ];
    const matches = findDuplicateCandidates(
      { firstName: 'Ama', lastName: 'Owusu', phone: '+233555000111' },
      candidates,
      now,
    );
    expect(matches).toEqual([]);
  });

  it('matches on name + same Bacenta + approximate age', () => {
    const candidates: DuplicateCandidateRecord[] = [
      {
        id: 'p2',
        firstName: 'Yaw',
        lastName: 'Boateng',
        dateOfBirth: new Date('1998-01-15'),
        activeBacentaGroupId: 'bacenta-1',
      },
    ];
    const matches = findDuplicateCandidates(
      {
        firstName: 'Yaw',
        lastName: 'Boateng',
        dateOfBirth: new Date('1999-06-01'),
        activeBacentaGroupId: 'bacenta-1',
      },
      candidates,
      now,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchedOn).toBe('NAME_AND_BACENTA_AND_APPROXIMATE_AGE');
  });

  it('does not match name + Bacenta when the age gap exceeds the tolerance', () => {
    const candidates: DuplicateCandidateRecord[] = [
      {
        id: 'p2',
        firstName: 'Yaw',
        lastName: 'Boateng',
        dateOfBirth: new Date('1980-01-15'),
        activeBacentaGroupId: 'bacenta-1',
      },
    ];
    const matches = findDuplicateCandidates(
      {
        firstName: 'Yaw',
        lastName: 'Boateng',
        dateOfBirth: new Date('1999-06-01'),
        activeBacentaGroupId: 'bacenta-1',
      },
      candidates,
      now,
    );
    expect(matches).toEqual([]);
  });

  it('does not match when Bacentas differ, even with identical name and age', () => {
    const candidates: DuplicateCandidateRecord[] = [
      {
        id: 'p2',
        firstName: 'Yaw',
        lastName: 'Boateng',
        dateOfBirth: new Date('1999-06-01'),
        activeBacentaGroupId: 'bacenta-2',
      },
    ];
    const matches = findDuplicateCandidates(
      {
        firstName: 'Yaw',
        lastName: 'Boateng',
        dateOfBirth: new Date('1999-06-01'),
        activeBacentaGroupId: 'bacenta-1',
      },
      candidates,
      now,
    );
    expect(matches).toEqual([]);
  });

  it('returns no matches against an empty candidate set', () => {
    expect(findDuplicateCandidates({ firstName: 'Ama', lastName: 'Owusu' }, [], now)).toEqual([]);
  });
});
