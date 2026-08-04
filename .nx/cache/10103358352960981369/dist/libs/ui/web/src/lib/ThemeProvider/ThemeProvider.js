"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ui_core_1 = require("@ecclesia/ui-core");
const ThemeContext_1 = require("./ThemeContext");
const useSystemColorScheme_1 = require("./useSystemColorScheme");
/**
 * The root theme context provider (Design System v1.0 Part 4). Every
 * `apps/web-admin` screen renders under exactly one of these, mounted
 * once near the application root - see `apps/web-admin/src/app/app.tsx`
 * for the acceptance-criteria wiring this foundation sprint adds.
 */
function ThemeProvider({ children, colorScheme }) {
    const systemScheme = (0, useSystemColorScheme_1.useSystemColorScheme)();
    const mode = colorScheme ?? systemScheme;
    const theme = (0, react_1.useMemo)(() => (0, ui_core_1.buildTheme)(mode), [mode]);
    return (0, jsx_runtime_1.jsx)(ThemeContext_1.ThemeContext.Provider, { value: theme, children: children });
}
//# sourceMappingURL=ThemeProvider.js.map