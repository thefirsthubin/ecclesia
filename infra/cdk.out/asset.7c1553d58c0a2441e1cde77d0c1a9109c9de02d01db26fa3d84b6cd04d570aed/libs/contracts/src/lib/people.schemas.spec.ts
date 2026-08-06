import {
  createGroupMembershipRequestSchema,
  createPersonSchema,
  createRoleAssignmentRequestSchema,
  lifecycleTransitionRequestSchema,
  updatePersonSchema,
} from './people.schemas';

describe('people.schemas (libs/contracts)', () => {
  describe('createPersonSchema', () => {
    it('accepts a minimal valid payload and defaults overrideDuplicateCheck to false', () => {
      const result = createPersonSchema.parse({ firstName: 'Ama', lastName: 'Owusu' });
      expect(result.overrideDuplicateCheck).toBe(false);
    });

    it('rejects a missing firstName', () => {
      expect(() => createPersonSchema.parse({ lastName: 'Owusu' })).toThrow();
    });

    it('rejects an invalid email', () => {
      expect(() =>
        createPersonSchema.parse({ firstName: 'Ama', lastName: 'Owusu', email: 'not-an-email' }),
      ).toThrow();
    });

    it('accepts a full payload', () => {
      const result = createPersonSchema.parse({
        firstName: 'Ama',
        lastName: 'Owusu',
        phone: '+233555000111',
        email: 'ama@example.com',
        dateOfBirth: '1999-06-01',
        address: '12 Ring Road',
        overrideDuplicateCheck: true,
      });
      expect(result.overrideDuplicateCheck).toBe(true);
    });
  });

  describe('updatePersonSchema', () => {
    it('rejects an empty update payload', () => {
      expect(() => updatePersonSchema.parse({})).toThrow();
    });

    it('accepts a single-field update, including explicit null to clear a field', () => {
      expect(updatePersonSchema.parse({ phone: null })).toEqual({ phone: null });
    });
  });

  describe('lifecycleTransitionRequestSchema', () => {
    it('accepts a valid stage value', () => {
      expect(lifecycleTransitionRequestSchema.parse({ toStage: 'MEMBER' }).toStage).toBe('MEMBER');
    });

    it('rejects an unknown stage value', () => {
      expect(() => lifecycleTransitionRequestSchema.parse({ toStage: 'NOT_A_STAGE' })).toThrow();
    });
  });

  describe('createGroupMembershipRequestSchema', () => {
    it('requires a valid uuid groupId', () => {
      expect(() => createGroupMembershipRequestSchema.parse({ groupId: 'not-a-uuid' })).toThrow();
    });

    it('accepts a valid groupId with no reason', () => {
      const result = createGroupMembershipRequestSchema.parse({
        groupId: '11111111-1111-1111-1111-111111111111',
      });
      expect(result.reason).toBeUndefined();
    });
  });

  describe('createRoleAssignmentRequestSchema', () => {
    it('defaults scopeGroupIds to an empty array', () => {
      const result = createRoleAssignmentRequestSchema.parse({ role: 'WORKER' });
      expect(result.scopeGroupIds).toEqual([]);
    });

    it('rejects an unknown role', () => {
      expect(() => createRoleAssignmentRequestSchema.parse({ role: 'NOT_A_ROLE' })).toThrow();
    });
  });
});
