import { type InputHTMLAttributes } from 'react';
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color' | 'type'> {
    label: string;
    testId?: string;
}
/**
 * A single option within a `RadioGroup` (Design System v1.0 Part 7.4).
 * Rarely used standalone - a lone radio button with no group has no valid
 * interaction model (nothing to select it *against*) - but exported on its
 * own for the rare case a screen composes a custom group layout `RadioGroup`
 * doesn't cover, same escape hatch `RadioGroup` itself documents.
 */
export declare function Radio({ label, testId, id, disabled, checked, ...rest }: RadioProps): import("react").JSX.Element;
//# sourceMappingURL=Radio.d.ts.map