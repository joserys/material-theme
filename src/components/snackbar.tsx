import { FC, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../theme/ThemeProvider';
import { GlyphIcon } from './glyphs';
import type { IconSource } from '../icons/IconProvider';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export interface SnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;    // when its time is up, the action is pressed, or it's closed
  action?: { label: string; onPress: () => void };
  duration?: number;        // ms before it hides itself (default 4000); Infinity keeps it up
  showClose?: boolean;      // a close button at the end
  closeAccessibilityLabel?: string; // default "Dismiss"
  closeIcon?: IconSource;   // replaces the built-in close mark
  safeArea?: boolean;       // keeps clear of the home indicator (default true)
  style?: StyleProp<ViewStyle>; // e.g. a bottom offset to sit above a navigation bar
}

// M3 snackbar: a short message on inverseSurface (bodyMedium, inverseOnSurface) with extraSmall (4dp)
// corners, an optional inversePrimary text action and close button. Sits at the bottom of its parent,
// slides up, and hides itself after `duration`. Screen readers announce the message; with a screen reader
// on, a snackbar with an action stays until it's used or closed, so there's time to reach it.
export const Snackbar: FC<SnackbarProps> = ({
  visible, message, onDismiss, action, duration = 4000, showClose = false, closeAccessibilityLabel = 'Dismiss', closeIcon, safeArea = true, style,
}) => {
  const { colors, shape, spacing, elevation, motion, reducedMotion } = useTheme();
  const { bottom, left, right } = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const progress = useSharedValue(0);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      AccessibilityInfo.announceForAccessibility(action ? `${message}. ${action.label} available` : message);
      progress.value = reducedMotion ? 1 : withSpring(1, motion.spring.defaultSpatial);
      return;
    }
    if (reducedMotion) {
      progress.value = 0;
      setRendered(false);
      return;
    }
    progress.value = withTiming(0, { duration: motion.duration.short4, easing: motion.easing.emphasizedAccelerate },
      finished => { if (finished) scheduleOnRN(setRendered, false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when it shows or hides
  }, [visible]);

  // Hides itself after `duration`
  useEffect(() => {
    if (!visible || !Number.isFinite(duration)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled().catch(() => false).then(reader => {
      if (cancelled || (reader && action)) return;
      timer = setTimeout(() => dismiss.current(), duration);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [visible, duration, action]);

  const slideStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * spacing.large }] }));

  if (!rendered) return null;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[{
        position: 'absolute',
        left: spacing.large + (safeArea ? left : 0),
        right: spacing.large + (safeArea ? right : 0),
        bottom: spacing.large + (safeArea ? bottom : 0),
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: shape.corner.extraSmall,
        backgroundColor: colors.inverseSurface,
        paddingLeft: spacing.large,
        paddingRight: action || showClose ? spacing.small : spacing.large,
        ...elevation.level3,
      }, slideStyle, style]}
    >
      <Text variant="bodyMedium" style={{ flex: 1, paddingVertical: spacing.medLarge, color: colors.inverseOnSurface }}>{message}</Text>
      {action && (
        <TouchableRipple
          onPress={() => { onDismiss(); action.onPress(); }}
          rippleColor={colors.inversePrimary}
          accessibilityLabel={action.label}
          containerStyle={{ marginLeft: spacing.small }}
          shapeStyle={{ borderRadius: 20 }}
          style={{ height: 40, justifyContent: 'center', paddingHorizontal: spacing.medLarge }}
        >
          <Text variant="labelLarge" style={{ color: colors.inversePrimary }}>{action.label}</Text>
        </TouchableRipple>
      )}
      {showClose && (
        <TouchableRipple
          onPress={onDismiss}
          rippleColor={colors.inverseOnSurface}
          accessibilityLabel={closeAccessibilityLabel}
          hitSlop={4}
          containerStyle={{ width: 40, height: 40 }}
          shapeStyle={{ borderRadius: 20 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <View><GlyphIcon name="close" source={closeIcon} size={24} color={colors.inverseOnSurface} /></View>
        </TouchableRipple>
      )}
    </Animated.View>
  );
};
