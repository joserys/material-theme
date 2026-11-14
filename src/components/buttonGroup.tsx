import { FC, useEffect, useRef } from "react";
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export interface ButtonGroupButton {
  value: string | number;
  label: string;
  icon?: IconSource;
  disabled?: boolean;
  accessibilityLabel?: string; // read instead of the label
}

interface SingleProps {
  multiSelect?: false;
  value: string | number;
  onValueChange: (value: string | number) => void;
}

interface MultiProps {
  multiSelect: true;
  value: (string | number)[];
  onValueChange: (value: (string | number)[]) => void;
}

export type ButtonGroupProps = (SingleProps | MultiProps) & {
  buttons: ButtonGroupButton[];
  containerStyle?: StyleProp<ViewStyle>;
};

interface SegmentProps {
  button: ButtonGroupButton;
  multiSelect?: boolean; // checkbox semantics for screen readers instead of radio
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
}

// One button of the group. Corners animate between three shapes (M3 Expressive shape morphing):
// resting = round outer ends + small inner corners, selected = fully round, pressed = inner corners squeezed.
// Disabled buttons and Reduce Motion always use the resting (unselected) shape; selection still shows by color.
const Segment: FC<SegmentProps> = ({ button, selected, isFirst, isLast, onPress, multiSelect = false }) => {
  const { colors, shape, motion, state, spacing, size, reducedMotion } = useTheme();
  const disabled = !!button.disabled;
  const round = size.control / 2;
  const inner = shape.corner.small;
  const squeezed = shape.corner.extraSmall;

  const showSelectedShape = selected && !disabled && !reducedMotion;
  const restingLeft = showSelectedShape || isFirst ? round : inner;
  const restingRight = showSelectedShape || isLast ? round : inner;
  const left = useSharedValue(restingLeft);
  const right = useSharedValue(restingRight);

  // Pressable can call onPressOut up to ~130ms after the press (so short taps still show the pressed state),
  // which is after a new selection has re-rendered. Reading the resting shape from a ref keeps that late
  // release from restoring the shape from before the selection.
  const resting = useRef({ left: restingLeft, right: restingRight });
  resting.current = { left: restingLeft, right: restingRight };

  const morph = (toLeft: number, toRight: number) => {
    if (reducedMotion) {
      left.value = toLeft;
      right.value = toRight;
      return;
    }
    left.value = withSpring(toLeft, motion.spring.fastSpatial);
    right.value = withSpring(toRight, motion.spring.fastSpatial);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- morph only when the resting shape changes
  useEffect(() => morph(restingLeft, restingRight), [restingLeft, restingRight]);

  const shapeStyle = useAnimatedStyle(() => ({
    borderTopLeftRadius: left.value,
    borderBottomLeftRadius: left.value,
    borderTopRightRadius: right.value,
    borderBottomRightRadius: right.value,
  }));

  const containerColor = disabled
    ? withOpacity(colors.onSurface, state.disabledContainer)
    : selected ? colors.primary : colors.surfaceContainerHighest;
  const contentColor = disabled
    ? withOpacity(colors.onSurface, state.disabledContent)
    : selected ? colors.onPrimary : colors.onSurfaceVariant;

  // M3: 40dp visual segment, tap area at least 48dp tall (segments are already wider than 48)
  const tapSlop = Math.max(0, (size.touchTarget - size.control) / 2);

  return (
    <TouchableRipple
      hitSlop={{ top: tapSlop, bottom: tapSlop }}
      containerStyle={{ flex: 1, height: size.control }}
      shapeStyle={[{ backgroundColor: containerColor }, shapeStyle]}
      onPress={onPress}
      onPressIn={() => {
        if (reducedMotion) return;
        morph(isFirst && !showSelectedShape ? round : squeezed, isLast && !showSelectedShape ? round : squeezed);
      }}
      onPressOut={() => morph(resting.current.left, resting.current.right)}
      disabled={disabled}
      rippleColor={contentColor}
      accessibilityRole={multiSelect ? 'checkbox' : 'radio'}
      accessibilityLabel={button.accessibilityLabel ?? button.label}
      accessibilityState={multiSelect ? { checked: selected, disabled } : { selected, disabled }}
      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.medLarge }}
      >
      {button.icon && <Icon source={button.icon} size={size.icon.small} color={contentColor} style={{ marginRight: spacing.med }} />}
      <Text variant="labelLarge" numberOfLines={1} style={{ color: contentColor }}>{button.label}</Text>
    </TouchableRipple>
  );
};

// M3 Expressive connected button group that picks one option, or several with `multiSelect`
// (`value` is then an array): equal-width buttons 2dp apart with pill-shaped outer ends. The selected
// buttons morph to fully round. The successor to segmented buttons.
export const ButtonGroup: FC<ButtonGroupProps> = props => {
  const { buttons, containerStyle } = props;
  const { spacing } = useTheme();
  const isSelected = (value: string | number) => (props.multiSelect ? props.value.includes(value) : props.value === value);

  const press = (value: string | number) => {
    if (props.multiSelect) {
      props.onValueChange(props.value.includes(value) ? props.value.filter(v => v !== value) : [...props.value, value]);
    } else {
      props.onValueChange(value);
    }
  };

  return (
    <View accessibilityRole={props.multiSelect ? 'toolbar' : 'radiogroup'} style={[{ flexDirection: 'row', gap: spacing.xsmall }, containerStyle]}>
      {buttons.map((button, index) => (
        <Segment
          key={button.value}
          button={button}
          multiSelect={props.multiSelect}
          selected={isSelected(button.value)}
          isFirst={index === 0}
          isLast={index === buttons.length - 1}
          onPress={() => { if (!button.disabled) press(button.value); }}
        />
      ))}
    </View>
  );
};

/** The previous name of ButtonGroup, kept so existing code keeps working */
export const SplitButtons = ButtonGroup;
export type SplitButtonsProps = ButtonGroupProps;
