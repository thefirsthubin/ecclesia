"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermission = exports.REQUIRE_PERMISSION_KEY = void 0;
// NestJS decorators call Reflect.defineMetadata at decoration time (not
// just at DI-resolution time), so the reflect-metadata polyfill must be
// loaded before this module's decorators run. apps/api's main.ts already
// imports it first for the running application; this import makes the
// same true when this file is loaded standalone (e.g. under Jest).
require("reflect-metadata");
const common_1 = require("@nestjs/common");
/** Metadata key `RbacGuard` reads via `Reflector` (Blueprint §9.4). */
exports.REQUIRE_PERMISSION_KEY = 'ecclesia:requirePermission';
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
const RequirePermission = (action) => (0, common_1.SetMetadata)(exports.REQUIRE_PERMISSION_KEY, action);
exports.RequirePermission = RequirePermission;
//# sourceMappingURL=require-permission.decorator.js.map