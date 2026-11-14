import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './text';

export interface TooltipProps {
  title: string;         // short label for what the element does
  children: ReactNode;   // the element it explains, usually an IconButton
  enterDelay?: number;   // ms of holding before it shows (default 500)
  leaveDelay?: number;   // ms it stays after the finger lifts (default 1500)
  style?: StyleProp<ViewStyle>;
}

// M3 plain tooltip: a short label on inverseSurface (bodySmall, inverseOnSurface) with extraSmall (4dp)
// corners, shown above the element when it's held. It only listens for the touch, so the element's own
// press still works. Screen readers don't need it: give the element an accessibilityLabel instead.
// Shown above the element inside its parent, so the parent needs room above and must not clip it.
export const Tooltip: FC<TooltipProps> = ({ title, children, enterDelay = 500, leaveDelay = 1500, style }) => {
  const { colors, shape, spacing, motion, reducedMotion } = useTheme();
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = reducedMotion ? (shown ? 1 : 0) : withTiming(shown ? 1 : 0, { duration: shown ? motion.duration.short3 : motion.duration.short2 });
  }, [shown, reducedMotion, opacity, motion.duration.short3, motion.duration.short2]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const later = (show: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(show), delay);
  };

  return (
    <View
      style={style}
      onTouchStart={() => later(true, enterDelay)}
      onTouchEnd={() => (shown ? later(false, leaveDelay) : clearTimeout(timer.current))}
      onTouchCancel={() => later(false, shown ? leaveDelay : 0)}
    >
      {children}
      {shown && (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', bottom: '100%', left: -100, right: -100, alignItems: 'center', marginBottom: spacing.small, zIndex: 10 }, fadeStyle]}>
          <View style={{ maxWidth: 200, minHeight: 24, justifyContent: 'center', paddingHorizontal: spacing.med, paddingVertical: spacing.small, borderRadius: shape.corner.extraSmall, backgroundColor: colors.inverseSurface }}>
            <Text variant="bodySmall" importantForAccessibility="no" style={{ color: colors.inverseOnSurface, textAlign: 'center' }}>{title}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};
