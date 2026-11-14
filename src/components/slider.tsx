import { FC, useMemo, useRef, useState } from 'react';
import { AccessibilityActionEvent, GestureResponderEvent, LayoutChangeEvent, PanResponder, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Text } from './text';

export interface SliderProps {
  value: number;
  onValueChange?: (value: number) => void;     // while dragging or tapping
  onSlidingComplete?: (value: number) => void; // once the finger lifts
  minimumValue?: number; // default 0
  maximumValue?: number; // default 1
  step?: number;         // snaps to multiples of step from the minimum; none = any value
  disabled?: boolean;
  showValueLabel?: boolean;               // shows the value above the handle while it's held (default true)
  formatValue?: (value: number) => string; // the value label and what screen readers say
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT = 44;       // handle height, and the slider's height
const TRACK = 16;        // M3 Expressive extra-small track
const HANDLE = 4;        // handle width; 2dp while held
const GAP = 6;           // space between the handle and each track
const INNER_CORNER = 2;  // track corners next to the handle
const STOP = 4;          // stop indicator dot at the track's end

// M3 Expressive slider: a 16dp track split by a 4dp x 44dp handle with a 6dp gap either side. Active
// track primary, inactive secondaryContainer with a primary stop dot at its end. The handle narrows while
// held and a value label shows above it. Drag or tap anywhere on it; screen readers adjust it in steps.
export const Slider: FC<SliderProps> = ({
  value, onValueChange, onSlidingComplete, minimumValue = 0, maximumValue = 1, step, disabled = false,
  showValueLabel = true, formatValue, accessibilityLabel, style,
}) => {
  const { colors, state, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const [held, setHeld] = useState(false);
  const range = maximumValue - minimumValue || 1;
  const format = formatValue ?? ((v: number) => String(Math.round(v * 100) / 100));

  const toValue = (x: number) => {
    const travel = Math.max(1, width - HANDLE);
    const fraction = Math.min(1, Math.max(0, (x - HANDLE / 2) / travel));
    let next = minimumValue + fraction * range;
    if (step) next = minimumValue + Math.round((next - minimumValue) / step) * step;
    return Math.min(maximumValue, Math.max(minimumValue, next));
  };

  // The responder outlives renders, so it reads the latest props through a ref
  const latest = useRef({ toValue, onValueChange, onSlidingComplete, value });
  latest.current = { toValue, onValueChange, onSlidingComplete, value };
  const start = useRef(0);
  const current = useRef(value);
  const set = (next: number) => {
    current.current = next;
    if (next !== latest.current.value) latest.current.onValueChange?.(next);
  };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event: GestureResponderEvent) => {
      start.current = event.nativeEvent.locationX;
      setHeld(true);
      set(latest.current.toValue(start.current));
    },
    onPanResponderMove: (_event, gesture) => set(latest.current.toValue(start.current + gesture.dx)),
    onPanResponderRelease: () => {
      setHeld(false);
      latest.current.onSlidingComplete?.(current.current);
    },
    onPanResponderTerminate: () => setHeld(false),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; reads the latest props through `latest`
  }), []);

  const fraction = (Math.min(maximumValue, Math.max(minimumValue, value)) - minimumValue) / range;
  const handleWidth = held ? HANDLE / 2 : HANDLE;
  const center = HANDLE / 2 + fraction * Math.max(0, width - HANDLE);
  const activeEnd = Math.max(0, center - HANDLE / 2 - GAP);
  const inactiveStart = Math.min(width, center + HANDLE / 2 + GAP);

  const active = disabled ? withOpacity(colors.onSurface, state.disabledContent) : colors.primary;
  const inactive = disabled ? withOpacity(colors.onSurface, state.disabledContainer) : colors.secondaryContainer;
  const a11yStep = step ?? range / 10;

  const onAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) => {
    const delta = nativeEvent.actionName === 'increment' ? a11yStep : nativeEvent.actionName === 'decrement' ? -a11yStep : 0;
    if (!delta) return;
    const next = Math.min(maximumValue, Math.max(minimumValue, value + delta));
    onValueChange?.(next);
    onSlidingComplete?.(next);
  };

  return (
    <View
      {...(disabled ? {} : responder.panHandlers)}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: minimumValue, max: maximumValue, now: value, text: format(value) }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      style={[{ height: HEIGHT, justifyContent: 'center' }, style]}
    >
      <View pointerEvents="none" style={{ height: HEIGHT }}>
        {activeEnd > 0 && (
          <View style={{ position: 'absolute', top: (HEIGHT - TRACK) / 2, left: 0, width: activeEnd, height: TRACK, backgroundColor: active, borderTopLeftRadius: TRACK / 2, borderBottomLeftRadius: TRACK / 2, borderTopRightRadius: INNER_CORNER, borderBottomRightRadius: INNER_CORNER }} />
        )}
        {inactiveStart < width && (
          <View style={{ position: 'absolute', top: (HEIGHT - TRACK) / 2, left: inactiveStart, right: 0, height: TRACK, backgroundColor: inactive, borderTopRightRadius: TRACK / 2, borderBottomRightRadius: TRACK / 2, borderTopLeftRadius: INNER_CORNER, borderBottomLeftRadius: INNER_CORNER, justifyContent: 'center', alignItems: 'flex-end', paddingRight: (TRACK - STOP) / 2 }}>
            <View style={{ width: STOP, height: STOP, borderRadius: STOP / 2, backgroundColor: active }} />
          </View>
        )}
        <View style={{ position: 'absolute', top: 0, left: center - handleWidth / 2, width: handleWidth, height: HEIGHT, borderRadius: handleWidth / 2, backgroundColor: active }} />
        {held && showValueLabel && (
          <View style={{ position: 'absolute', bottom: HEIGHT + spacing.small, left: center - 24, width: 48, height: 44, borderRadius: 22, backgroundColor: colors.inverseSurface, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="labelLarge" numberOfLines={1} style={{ color: colors.inverseOnSurface }}>{format(value)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
