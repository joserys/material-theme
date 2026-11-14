import { FC, ReactNode, useRef } from 'react';
import { GestureResponderEvent, LayoutRectangle, Platform, Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';

export interface TouchableRippleProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  rippleColor?: string; // content color the ripple is drawn in (M3 pressed state layer); defaults to onSurface
  // Shaped mode, for controls whose visual is smaller than their tap area (M3: 40dp visual, 48dp tap area).
  // When set, the pressable is the outer element (sized by containerStyle, extended by hitSlop) and the
  // shape (corners, fill, border; may be an animated style) clips the content and the ripple inside it.
  shapeStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  containerStyle?: StyleProp<ViewStyle>;
}

// Pressable with an M3 ripple. Android uses the native ripple; iOS has none, so a circle grows from the touch
// point to the farthest edge and fades out on release. Round the corners by wrapping it in a view with
// borderRadius + overflow: 'hidden' (Android doesn't clip its ripple to its own rounded corners), or use
// shapeStyle, which draws that circle ripple on both platforms inside the shape.
// A clipping parent stops touches outside its bounds, so hitSlop only reaches past a rounded wrapper in
// shaped mode, where the pressable is outside the clip.
export const TouchableRipple: FC<TouchableRippleProps> = ({
  children,
  style,
  rippleColor,
  shapeStyle,
  containerStyle,
  onPressIn,
  onPressOut,
  onLayout,
  accessibilityRole = 'button',
  ...props
}) => {
  const { colors, state, motion } = useTheme();
  const color = rippleColor ?? colors.onSurface;

  const layout = useRef<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
  const centerX = useSharedValue(0);
  const centerY = useSharedValue(0);
  const radius = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const rippleStyle = useAnimatedStyle(() => ({
    left: centerX.value - radius.value,
    top: centerY.value - radius.value,
    width: radius.value * 2,
    height: radius.value * 2,
    borderRadius: radius.value,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const shaped = shapeStyle !== undefined;

  if (Platform.OS === 'android' && !shaped) {
    return (
      <Pressable
        style={style}
        android_ripple={{ color: withOpacity(color, state.pressed), foreground: true }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLayout={onLayout}
        accessibilityRole={accessibilityRole}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  const handlePressIn = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = layout.current;
    centerX.value = locationX;
    centerY.value = locationY;
    radius.value = Math.hypot(Math.max(locationX, width - locationX), Math.max(locationY, height - locationY));
    scale.value = 0;
    opacity.value = state.pressed;
    scale.value = withTiming(1, { duration: motion.duration.medium4, easing: motion.easing.standardDecelerate });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    opacity.value = withTiming(0, { duration: motion.duration.medium2, easing: motion.easing.standard });
    onPressOut?.(event);
  };

  const ripple = <Animated.View pointerEvents="none" style={[{ position: 'absolute', backgroundColor: color }, rippleStyle]} />;

  return (
    <Pressable
      style={shaped ? containerStyle : [{ overflow: 'hidden' }, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={event => {
        layout.current = event.nativeEvent.layout;
        onLayout?.(event);
      }}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {shaped ? (
        <Animated.View style={[{ flexGrow: 1, overflow: 'hidden' }, shapeStyle]}>
          <View style={style}>{children}</View>
          {ripple}
        </Animated.View>
      ) : (
        <>
          {children}
          {ripple}
        </>
      )}
    </Pressable>
  );
};
