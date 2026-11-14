import { FC, useEffect } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';

interface SwitchProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const BORDER = 2;
const THUMB_MAX = 28;

// M3 switch: 52x32 track. Off: outlined track with a small 16dp thumb on the left.
// On: primary track with a 24dp thumb on the right. The thumb grows to 28dp while pressed and springs between states.
export const Switch: FC<SwitchProps> = ({ value, onValueChange, disabled = false, accessibilityLabel, style }) => {
  const { colors, motion, state } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, motion.spring.fastSpatial);
  }, [value, progress, motion.spring.fastSpatial]);

  const trackOff = colors.surfaceContainerHighest;
  const trackOn = colors.primary;
  const outline = colors.outline;
  const thumbOff = colors.outline;
  const thumbOn = colors.onPrimary;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [trackOff, trackOn]),
    borderColor: interpolateColor(progress.value, [0, 1], [outline, trackOn]),
  }));

  // The thumb is laid out once at its largest (pressed) size and moved/resized with transforms only,
  // so the animation never triggers a layout pass
  const thumbStyle = useAnimatedStyle(() => {
    const restingSize = interpolate(progress.value, [0, 1], [16, 24]);
    const size = interpolate(pressed.value, [0, 1], [restingSize, THUMB_MAX]);
    // Thumb center travels from 16dp (left) to 36dp (right) inside the track
    const center = interpolate(progress.value, [0, 1], [TRACK_HEIGHT / 2, TRACK_WIDTH - TRACK_HEIGHT / 2]);
    return {
      transform: [{ translateX: center - TRACK_HEIGHT / 2 }, { scale: size / THUMB_MAX }],
      backgroundColor: interpolateColor(progress.value, [0, 1], [thumbOff, thumbOn]),
    };
  });

  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      onPressIn={() => { pressed.value = withSpring(1, motion.spring.fastEffects); }}
      onPressOut={() => { pressed.value = withSpring(0, motion.spring.fastEffects); }}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      style={[{ opacity: disabled ? state.disabledContent : 1 }, style]}
    >
      <Animated.View style={[{ width: TRACK_WIDTH, height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, borderWidth: BORDER }, trackStyle]}>
        <Animated.View
          style={[{
            position: 'absolute',
            width: THUMB_MAX,
            height: THUMB_MAX,
            borderRadius: THUMB_MAX / 2,
            left: TRACK_HEIGHT / 2 - THUMB_MAX / 2 - BORDER,
            top: (TRACK_HEIGHT - THUMB_MAX) / 2 - BORDER,
          }, thumbStyle]}
        />
      </Animated.View>
    </Pressable>
  );
};
