"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// Types (PRD §17.2-17.4; Blueprint §9.1-9.3)
tslib_1.__exportStar(require("./lib/roles"), exports);
tslib_1.__exportStar(require("./lib/actions"), exports);
tslib_1.__exportStar(require("./lib/types"), exports);
// The permission matrix as executable data (Blueprint §9.3)
tslib_1.__exportStar(require("./lib/permission-matrix"), exports);
// Record-level policy checks (Blueprint §9.1, §9.4)
tslib_1.__exportStar(require("./lib/record-level-checks"), exports);
// The authorization engine (Blueprint §9.2)
tslib_1.__exportStar(require("./lib/evaluate"), exports);
// NestJS integration (Blueprint §9.4)
tslib_1.__exportStar(require("./lib/request-context"), exports);
tslib_1.__exportStar(require("./lib/decorators/require-permission.decorator"), exports);
tslib_1.__exportStar(require("./lib/guards/rbac.guard"), exports);
tslib_1.__exportStar(require("./lib/guards/record-level-policy.guard"), exports);
//# sourceMappingURL=index.js.map