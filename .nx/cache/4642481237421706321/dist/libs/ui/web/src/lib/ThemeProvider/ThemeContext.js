"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeContext = void 0;
const react_1 = require("react");
const ui_core_1 = require("@ecclesia/ui-core");
/**
 * Defaults to `lightTheme` (not `undefined`) so a component rendered in a
 * test or story without a wrapping `<ThemeProvider>` still gets real
 * tokens instead of a crash - `useTheme()` still warns in that case (see
 * useTheme.ts) so a missing Provider in real app code is not silently
 * invisible, but a unit test for a single component doesn't need to know
 * that.
 */
exports.ThemeContext = (0, react_1.createContext)(ui_core_1.lightTheme);
//# sourceMappingURL=ThemeContext.js.map