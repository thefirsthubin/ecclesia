import { type GestureResponderEvent } from 'react-native';
import type { ElevationLevel, SpacingStep } from '@ecclesia/ui-core';
export interface CardProps {
    children: React.ReactNode;
    padding?: SpacingStep;
    elevation?: ElevationLevel;
    interactive?: boolean;
    onPress?: (event: GestureResponderEvent) => void;
    testId?: string;
}
/** React Native equivalent of `ui-web`'s `Card` - `Pressable` when `interactive`, a plain `View` otherwise. */
export declare function Card({ children, padding, elevation, interactive, onPress, testId }: CardProps): import("react").JSX.Element;
//# sourceMappingURL=Card.d.ts.map