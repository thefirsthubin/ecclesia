import 'reflect-metadata';
import type { Action } from '../actions';
/** Metadata key `RbacGuard` reads via `Reflector` (Blueprint §9.4). */
export declare const REQUIRE_PERMISSION_KEY: "ecclesia:requirePermission";
/**
 * Declares which `Action` (from PRD §17.3's matrix) a controller method
 * requires. Usage matches Blueprint §9.4 exactly:
 *
 * ```ts
 * @RequirePermission('stewardship.transaction.verify')
 * @UseGuards(RbacGuard, RecordLevelPolicyGuard)
 * async verifyTransaction(...) { ... }
 * ```
 */
export declare const RequirePermission: (action: Action) => import("@nestjs/common").CustomDecorator<"ecclesia:requirePermission">;
//# sourceMappingURL=require-permission.decorator.d.ts.map