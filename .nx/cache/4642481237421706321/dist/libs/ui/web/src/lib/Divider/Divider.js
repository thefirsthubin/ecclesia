"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Divider = Divider;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
/** A visual content separator (Design System v1.0 Part 5.7's border discipline). Purely decorative - hidden from assistive technology. */
function Divider({ orientation = 'horizontal', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const isHorizontal = orientation === 'horizontal';
    return ((0, jsx_runtime_1.jsx)("div", { role: "separator", "aria-orientation": orientation, "data-testid": testId, style: {
            border: 'none',
            backgroundColor: theme.colors.border.subtle,
            width: isHorizontal ? '100%' : 1,
            height: isHorizontal ? 1 : '100%',
        } }));
}
//# sourceMappingURL=Divider.js.map