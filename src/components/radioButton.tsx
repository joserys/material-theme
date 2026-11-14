import { FC, useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { TouchableRipple } from './touchableRipple';

export interface RadioButtonProps {
  selected: boolean;
  onPress?: () => void; // select this option (the app keeps which one is selected)
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const RING = 20;
const DOT = 10;
const TARGET = 40;

// M3 radio button: a 20dp ring (2dp, onSurfaceVariant) in a 40dp round state layer, 48dp tap area.
// Selected: primary ring with a 10dp primary dot that springs in.
export const RadioButton: FC<RadioButtonProps> = ({ selected, onPress, disabled = false, accessibilityLabel, style }) => {
  const { colors, motion, state, size, reducedMotion } = useTheme();
  const dot = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    dot.value = reducedMotion ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, motion.spring.fastSpatial);
  }, [selected, reducedMotion, dot, motion.spring.fastSpatial]);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: dot.value }] }));

  const color = disabled ? withOpacity(colors.onSurface, state.disabledContent) : selected ? colors.primary : colors.onSurfaceVariant;

  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled || !onPress}
      rippleColor={selected ? colors.primary : colors.onSurface}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected, disabled }}
      hitSlop={(size.touchTarget - TARGET) / 2}
      containerStyle={[{ width: TARGET, height: TARGET }, style]}
      shapeStyle={{ borderRadius: TARGET / 2 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color }, dotStyle]} />
      </View>
    </TouchableRipple>
  );
};
