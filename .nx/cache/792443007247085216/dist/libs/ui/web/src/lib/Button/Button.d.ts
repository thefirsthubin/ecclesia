import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { ActionVariant, IconName, Size } from '@ecclesia/ui-core';
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
    children?: ReactNode;
    variant?: ActionVariant;
    size?: Size;
    loading?: boolean;
    iconLeft?: IconName;
    iconRight?: IconName;
    /** Required when `children` is empty (icon-only button) - Design System v1.0 Part 7.1. */
    accessibilityLabel?: string;
    testId?: string;
}
/**
 * The primary action trigger (Design System v1.0 Part 7.1). Exactly one
 * `variant="primary"` per screen is a *usage* rule for consumers, not
 * something this component can enforce structurally - documented in
 * `../../../UI_DESIGN_NOTES.md`.
 */
export declare function Button({ children, variant, size, loading, disabled, iconLeft, iconRight, accessibilityLabel, testId, onClick, type, ...rest }: ButtonProps): import("react").JSX.Element;
//# sourceMappingURL=Button.d.ts.map