import { FC, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export interface ProgressIndicatorProps {
  value?: number;       // 0-1; leave out for indeterminate (unknown time)
  wavy?: boolean;       // M3 Expressive wavy active indicator, for longer waits that should feel alive
  color?: string;       // active indicator (default primary)
  trackColor?: string;  // track (default secondaryContainer)
  accessibilityLabel?: string; // what's loading, e.g. "Downloading level"
  style?: StyleProp<ViewStyle>;
}

const THICKNESS = 4;
const GAP = 4;          // between the active indicator and the track
const AMPLITUDE = 3;    // wave height either side of the line
const WAVELENGTH = 40;  // linear wave
const STOP = 4;         // stop indicator dot at the track's end (determinate)

const a11y = (value: number | undefined, label?: string) => ({
  accessible: true,
  accessibilityRole: 'progressbar' as const,
  accessibilityLabel: label,
  accessibilityValue: value === undefined ? undefined : { min: 0, max: 100, now: Math.round(value * 100) },
  accessibilityState: { busy: value === undefined || value < 1 },
});

// A sine wave along x from 0 to `width`, centred on `middle`
const wavePath = (width: number, middle: number) => {
  let d = `M 0 ${middle}`;
  for (let x = 2; x <= width; x += 2) d += ` L ${x} ${middle + AMPLITUDE * Math.sin((x / WAVELENGTH) * 2 * Math.PI)}`;
  return d;
};

// The active line: flat with round ends, or a travelling wave clipped to its width
const ActiveLine: FC<{ width: number; full: number; wavy: boolean; color: string; moving: boolean }> = ({ width, full, wavy, color, moving }) => {
  const phase = useSharedValue(0);
  useEffect(() => {
    if (!wavy || !moving) {
      cancelAnimation(phase);
      phase.value = 0;
      return;
    }
    phase.value = withRepeat(withTiming(-WAVELENGTH, { duration: 1000, easing: Easing.linear }), -1);
  }, [wavy, moving, phase]);
  const waveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: phase.value }] }));
  const height = wavy ? THICKNESS + AMPLITUDE * 2 : THICKNESS;

  if (!wavy) return <View style={{ width, height, borderRadius: THICKNESS / 2, backgroundColor: color }} />;
  return (
    <View style={{ width, height, overflow: 'hidden', borderRadius: THICKNESS / 2 }}>
      <Animated.View style={waveStyle}>
        <Svg width={full + WAVELENGTH} height={height}>
          <Path d={wavePath(full + WAVELENGTH, height / 2)} stroke={color} strokeWidth={THICKNESS} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
};

// M3 Expressive linear progress indicator: a 4dp active indicator (primary), a 4dp gap, then the track
// (secondaryContainer) with a stop dot at its end. Indeterminate: a segment sweeps across the track.
// With `wavy` the active indicator is a moving wave; Reduce Motion keeps the wave still.
export const LinearProgress: FC<ProgressIndicatorProps> = ({ value, wavy = false, color, trackColor, accessibilityLabel, style }) => {
  const { colors, motion, reducedMotion } = useTheme();
  const [width, setWidth] = useState(0);
  const active = color ?? colors.primary;
  const track = trackColor ?? colors.secondaryContainer;
  const height = wavy ? THICKNESS + AMPLITUDE * 2 : THICKNESS;
  const indeterminate = value === undefined;

  const sweep = useSharedValue(0);
  useEffect(() => {
    if (!indeterminate) return;
    sweep.value = 0;
    sweep.value = withRepeat(withTiming(1, { duration: 1800, easing: motion.easing.standard }), -1);
    return () => cancelAnimation(sweep);
  }, [indeterminate, sweep, motion.easing.standard]);
  const segment = width * 0.4;
  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateX: -segment + sweep.value * (width + segment) }] }));

  const fraction = Math.min(1, Math.max(0, value ?? 0));
  const activeWidth = fraction * width;
  const trackStart = fraction > 0 ? Math.min(width, activeWidth + GAP) : 0;

  return (
    <View {...a11y(value, accessibilityLabel)} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)} style={[{ height, justifyContent: 'center' }, style]}>
      {width > 0 && (indeterminate ? (
        <View style={{ height, justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: 0, right: 0, height: THICKNESS, borderRadius: THICKNESS / 2, backgroundColor: track }} />
          <Animated.View style={sweepStyle}>
            <ActiveLine width={segment} full={segment} wavy={wavy} color={active} moving={!reducedMotion} />
          </Animated.View>
        </View>
      ) : (
        <View style={{ height, flexDirection: 'row', alignItems: 'center' }}>
          {activeWidth > 0 && <ActiveLine width={activeWidth} full={width} wavy={wavy && fraction < 1} color={active} moving={!reducedMotion} />}
          {trackStart < width && (
            <View style={{ position: 'absolute', left: trackStart, right: 0, height: THICKNESS, borderRadius: THICKNESS / 2, backgroundColor: track, alignItems: 'flex-end', justifyContent: 'center' }}>
              <View style={{ width: STOP, height: STOP, borderRadius: STOP / 2, backgroundColor: active }} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

// The active arc from the top, clockwise: a plain arc, or a wavy ring section
const arcPath = (center: number, radius: number, fraction: number, wavy: boolean) => {
  const sweep = fraction * 2 * Math.PI;
  const waves = Math.max(1, Math.round((2 * Math.PI * radius) / 14));
  const steps = Math.max(2, Math.ceil(fraction * 120));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * sweep - Math.PI / 2;
    const r = radius + (wavy ? 1.6 * Math.sin((angle + Math.PI / 2) * waves) : 0);
    d += `${i === 0 ? 'M' : ' L'} ${center + r * Math.cos(angle)} ${center + r * Math.sin(angle)}`;
  }
  return d;
};

export interface CircularProgressProps extends ProgressIndicatorProps {
  size?: number; // default 40 (48 when wavy)
}

// M3 Expressive circular progress indicator: a 4dp ring track (secondaryContainer) with a gap either side
// of the primary active arc, which starts at the top. Indeterminate: an arc that spins. `wavy` gives the
// arc the Expressive wave.
export const CircularProgress: FC<CircularProgressProps> = ({ value, wavy = false, size, color, trackColor, accessibilityLabel, style }) => {
  const { colors } = useTheme();
  const diameter = size ?? (wavy ? 48 : 40);
  const center = diameter / 2;
  const radius = center - THICKNESS / 2 - (wavy ? 1.6 : 0);
  const circumference = 2 * Math.PI * radius;
  const active = color ?? colors.primary;
  const track = trackColor ?? colors.secondaryContainer;
  const indeterminate = value === undefined;
  const fraction = indeterminate ? 0.3 : Math.min(1, Math.max(0, value));

  const spin = useSharedValue(0);
  useEffect(() => {
    if (!indeterminate) return;
    spin.value = 0;
    spin.value = withRepeat(withTiming(360, { duration: 1333, easing: Easing.linear }), -1);
    return () => cancelAnimation(spin);
  }, [indeterminate, spin]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  // Gap either side of the arc, in path length: the gap plus the room the round ends take up
  const gap = fraction > 0 && fraction < 1 ? GAP + THICKNESS : 0;
  const trackLength = Math.max(0, circumference * (1 - fraction) - 2 * gap);

  return (
    <Animated.View {...a11y(value, accessibilityLabel)} style={[{ width: diameter, height: diameter }, indeterminate ? spinStyle : null, style]}>
      <Svg width={diameter} height={diameter}>
        {trackLength > 0 && (
          <Circle
            cx={center} cy={center} r={radius} fill="none" stroke={track} strokeWidth={THICKNESS} strokeLinecap="round"
            strokeDasharray={`${trackLength} ${circumference}`}
            strokeDashoffset={-(circumference * fraction + gap)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
        {fraction > 0 && <Path d={arcPath(center, radius, fraction, wavy)} stroke={active} strokeWidth={THICKNESS} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      </Svg>
    </Animated.View>
  );
};
