import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Portal } from './portal';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;        // scrim tap, drag down past the threshold, or the back button, when `dismissable`
  dismissable?: boolean;        // default true; false keeps it open until the app hides it
  showHandle?: boolean;         // the drag handle (default true); without it the sheet can't be dragged
  accessibilityLabel?: string;  // names the sheet for screen readers, e.g. "Manage ingredients"
  children?: ReactNode;         // anything: a form, a list... (use a ScrollView for long content)
  style?: StyleProp<ViewStyle>; // the sheet
}

const MAX_WIDTH = 640;
const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 0.8;

interface SheetProps extends BottomSheetProps {
  dismissable: boolean;
  showHandle: boolean;
}

const Sheet: FC<SheetProps> = ({ visible, onDismiss, dismissable, showHandle, accessibilityLabel, children, style }) => {
  const { colors, shape, spacing, elevation, motion, reducedMotion } = useTheme();
  const window = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const offset = useSharedValue(window.height); // how far the sheet is below its resting place

  const latest = useRef({ visible, dismissable, onDismiss });
  latest.current = { visible, dismissable, onDismiss };

  // Slides up when shown and down when hidden; jumps with Reduce Motion
  useEffect(() => {
    if (visible) {
      setMounted(true);
      offset.value = reducedMotion ? 0 : withSpring(0, motion.spring.defaultSpatial);
      return;
    }
    if (reducedMotion) {
      offset.value = window.height;
      setMounted(false);
      return;
    }
    offset.value = withTiming(window.height, { duration: motion.duration.medium2, easing: motion.easing.emphasizedAccelerate },
      finished => { if (finished) scheduleOnRN(setMounted, false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- animate only when visibility or the motion setting changes
  }, [visible, reducedMotion]);

  // Android back button closes it
  useEffect(() => {
    if (!visible || !dismissable) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { onDismiss(); return true; });
    return () => subscription.remove();
  }, [visible, dismissable, onDismiss]);

  // Dragging the handle down moves the sheet; letting go far or fast enough asks the app to dismiss it
  const settle = () => {
    offset.value = reducedMotion ? 0 : withSpring(0, motion.spring.fastSpatial);
  };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => latest.current.dismissable,
    onPanResponderMove: (_, gesture) => { offset.value = Math.max(0, gesture.dy); },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
        latest.current.onDismiss();
        // If the app keeps it open, bring it back
        setTimeout(() => { if (latest.current.visible) settle(); }, 150);
      } else {
        settle();
      }
    },
    onPanResponderTerminate: settle,
  // eslint-disable-next-line react-hooks/exhaustive-deps -- built once; reads the latest values from refs
  }), []);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: interpolate(offset.value, [0, window.height / 2], [1, 0], 'clamp') }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  if (!mounted && !visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center' }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, scrimStyle]}>
        <Pressable
          onPress={dismissable ? onDismiss : undefined}
          accessible={dismissable}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}
        style={[{
          width: '100%',
          maxWidth: MAX_WIDTH,
          maxHeight: window.height - top - spacing.xxlarge,
          paddingBottom: bottom,
          backgroundColor: colors.surfaceContainerLow,
          borderTopLeftRadius: shape.corner.extraLarge,
          borderTopRightRadius: shape.corner.extraLarge,
          ...elevation.level1,
        }, sheetStyle, style]}
      >
        {showHandle && (
          <View {...pan.panHandlers} accessible={false} style={{ alignItems: 'center', paddingVertical: spacing.largeIncreased + spacing.xsmall }}>
            <View style={{ width: 32, height: 4, borderRadius: shape.corner.full, backgroundColor: withOpacity(colors.onSurfaceVariant, 0.4) }} />
          </View>
        )}
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

// M3 modal bottom sheet: a surfaceContainerLow panel with extra-large (28dp) top corners at elevation 1, up to
// 640dp wide, rising from the bottom of the screen over a scrim, with the drag handle on top. Drag the handle
// down, tap the scrim or press back to dismiss. Drawn through Portal, so it covers the navigator and screen.
// Keep `visible` in the app's state and clear it in `onDismiss`.
export const BottomSheet: FC<BottomSheetProps> = ({ dismissable = true, showHandle = true, ...props }) => (
  <Portal>
    <Sheet dismissable={dismissable} showHandle={showHandle} {...props} />
  </Portal>
);
