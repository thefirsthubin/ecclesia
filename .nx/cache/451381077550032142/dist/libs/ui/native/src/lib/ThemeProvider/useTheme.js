"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTheme = useTheme;
exports.useColorScheme = useColorScheme;
const react_1 = require("react");
const ThemeContext_1 = require("./ThemeContext");
function useTheme() {
    return (0, react_1.useContext)(ThemeContext_1.ThemeContext);
}
function useColorScheme() {
    return (0, react_1.useContext)(ThemeContext_1.ThemeContext).mode;
}
//# sourceMappingURL=useTheme.js.map