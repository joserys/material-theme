import { FC, useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export interface LoadingIndicatorProps {
  contained?: boolean;  // on a primaryContainer circle, for over images or busy content
  size?: number;        // container size, default 48 (the shape is 38)
  color?: string;       // default primary (onPrimaryContainer when contained)
  accessibilityLabel?: string; // default "Loading"
  style?: StyleProp<ViewStyle>;
}

const POINTS = 72;
const STEP_MS = 650; // one morph

// Radius (0-1) of each shape at POINTS evenly spaced angles
const sample = (radius: (angle: number) => number) => {
  const raw = Array.from({ length: POINTS }, (_, i) => radius((i / POINTS) * 2 * Math.PI));
  const max = Math.max(...raw);
  return raw.map(r => r / max);
};
const wavy = (lobes: number, depth: number) => sample(angle => 1 + depth * Math.cos(lobes * angle));
const superellipse = (width: number, height: number, power: number) =>
  sample(angle => 1 / Math.pow(Math.pow(Math.abs(Math.cos(angle)) / width, power) + Math.pow(Math.abs(Math.sin(angle)) / height, power), 1 / power));

// The M3 Expressive loading indicator's shape sequence, drawn as smooth radial shapes
const SHAPES = [
  wavy(10, 0.1),                 // soft burst
  wavy(9, 0.08),                 // 9-sided cookie
  wavy(5, 0.09),                 // pentagon
  superellipse(1, 0.62, 2.6),    // pill
  wavy(8, 0.05),                 // sunny
  wavy(4, 0.13),                 // 4-sided cookie
  superellipse(1, 0.8, 2),       // oval
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

// M3 Expressive loading indicator, for short waits: a shape that keeps morphing through seven Material
// shapes while it turns. With Reduce Motion it holds one shape and turns slowly.
export const LoadingIndicator: FC<LoadingIndicatorProps> = ({ contained = false, size = 48, color, accessibilityLabel = 'Loading', style }) => {
  const { colors, reducedMotion } = useTheme();
  const shapeSize = size * (38 / 48);
  const half = shapeSize / 2;
  const fill = color ?? (contained ? colors.onPrimaryContainer : colors.primary);

  const progress = useSharedValue(0); // 0 to SHAPES.length, one unit per morph
  const turn = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    turn.value = 0;
    if (!reducedMotion) progress.value = withRepeat(withTiming(SHAPES.length, { duration: SHAPES.length * STEP_MS, easing: Easing.linear }), -1);
    turn.value = withRepeat(withTiming(360, { duration: reducedMotion ? 6000 : 4666, easing: Easing.linear }), -1);
    return () => {
      cancelAnimation(progress);
      cancelAnimation(turn);
    };
  }, [reducedMotion, progress, turn]);

  const shapeProps = useAnimatedProps(() => {
    const step = Math.floor(progress.value) % SHAPES.length;
    const t = progress.value - Math.floor(progress.value);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out between shapes
    const from = SHAPES[step];
    const to = SHAPES[(step + 1) % SHAPES.length];
    let d = '';
    for (let i = 0; i < POINTS; i++) {
      const angle = (i / POINTS) * 2 * Math.PI;
      const r = half * (from[i] + (to[i] - from[i]) * eased);
      d += `${i === 0 ? 'M' : 'L'}${half + r * Math.cos(angle)} ${half + r * Math.sin(angle)}`;
    }
    return { d: d + 'Z' };
  });
  // Each morph also turns the shape a quarter, on top of the steady turn
  const turnStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value + progress.value * 90}deg` }] }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: contained ? colors.primaryContainer : undefined,
      }, style]}
    >
      <Animated.View style={turnStyle}>
        <Svg width={shapeSize} height={shapeSize}>
          <AnimatedPath animatedProps={shapeProps} fill={fill} />
        </Svg>
      </Animated.View>
    </View>
  );
};
