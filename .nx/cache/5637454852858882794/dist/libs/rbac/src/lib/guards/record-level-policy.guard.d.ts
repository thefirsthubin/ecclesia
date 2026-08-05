import 'reflect-metadata';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Generic, shared guard evaluating Blueprint §9.2 step 4 (the
 * record-level policy check, if the matched rule names one). Must run
 * *after* `RbacGuard` in the same `@UseGuards(...)` list (Blueprint
 * §9.4's exact ordering) - it consumes the decision `RbacGuard` already
 * attached to the request rather than re-deriving it.
 *
 * A rule with no `recordLevelCheck` simply passes through unchanged, so
 * this guard is safe to include even on endpoints that turn out not to
 * need one - though Blueprint §9.4's example only shows it where a check
 * is actually named.
 */
export declare class RecordLevelPolicyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=record-level-policy.guard.d.ts.map