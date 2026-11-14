// Reanimated 4.6's own Jest mock can't start under @react-native/jest-preset 0.85 (it calls native-only
// setup), so the tests use this stand-in: shared values are plain objects and animations jump to their
// end value, the way Reduce Motion does.
jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView, Image } = require('react-native');
  const end = value => value;
  const finish = (value, _config, callback) => { callback?.(true); return value; };
  const interpolate = (x, input, output) => {
    if (x <= input[0]) return output[0];
    for (let i = 1; i < input.length; i++) {
      if (x <= input[i]) return output[i - 1] + ((x - input[i - 1]) / (input[i] - input[i - 1])) * (output[i] - output[i - 1]);
    }
    return output[output.length - 1];
  };
  const interpolateColor = (x, input, output) => output[interpolate(x, input, input.map((_, i) => i)) >= input.length - 1 ? output.length - 1 : Math.round(interpolate(x, input, input.map((_, i) => i)))];
  const bezier = () => t => t;
  const Animated = { View, Text, ScrollView, Image, createAnimatedComponent: component => component };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: initial => { const ref = require('react').useRef({ value: initial }); return ref.current; },
    useAnimatedStyle: worklet => worklet(),
    useAnimatedProps: worklet => worklet(),
    useDerivedValue: worklet => ({ value: worklet() }),
    withTiming: finish,
    withSpring: finish,
    withDelay: (_delay, value) => value,
    withSequence: (...values) => values[values.length - 1],
    withRepeat: end,
    cancelAnimation: () => {},
    interpolate,
    interpolateColor,
    Easing: { bezier, linear: t => t },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
  };
});
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (fn, ...args) => fn(...args) }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
