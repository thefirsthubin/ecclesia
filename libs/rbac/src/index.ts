// Types (PRD §17.2-17.4; Blueprint §9.1-9.3)
export * from './lib/roles';
export * from './lib/actions';
export * from './lib/types';

// The permission matrix as executable data (Blueprint §9.3)
export * from './lib/permission-matrix';

// Record-level policy checks (Blueprint §9.1, §9.4)
export * from './lib/record-level-checks';

// The authorization engine (Blueprint §9.2)
export * from './lib/evaluate';

// NestJS integration (Blueprint §9.4)
export * from './lib/request-context';
export * from './lib/decorators/require-permission.decorator';
export * from './lib/guards/rbac.guard';
export * from './lib/guards/record-level-policy.guard';
