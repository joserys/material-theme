import { FC, useEffect, useState } from 'react';
import { Pressable, StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { IconButton } from './iconButton';
import { Text } from './text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor' | 'editable'> {
  label: string;
  mode?: 'filled' | 'outlined';  // default 'filled'
  supportingText?: string;       // helper text under the field
  error?: boolean;
  errorText?: string;            // shown instead of supportingText while `error`
  leadingIcon?: IconSource;
  trailingIcon?: IconSource;     // e.g. clear or show password
  onTrailingIconPress?: () => void;
  trailingIconAccessibilityLabel?: string;
  disabled?: boolean;
  /** Outlined fields: the color behind the field, so the floating label's cut-out matches. Default surface. */
  backgroundColor?: string;
  /** Text shown before the typed text (e.g. "$"), only while the field is focused or filled, as in M3 */
  prefixText?: string;
  /** Text shown after the typed text (e.g. "kcal"), only while the field is focused or filled, as in M3 */
  suffixText?: string;
  /** With `multiline`: the field's height at rest (and the least it shrinks to). Default 56. */
  minHeight?: number;
  /** With `multiline`: the most the field grows to when `autoGrow`; the text scrolls past it */
  maxHeight?: number;
  /** With `multiline`: grow with the text (default). When false, the field stays `minHeight` tall and the text scrolls. */
  autoGrow?: boolean;
  /**
   * Makes the whole field one button instead of a text input (used by Select). The text can't be typed in,
   * and the trailing icon is only decoration. Give `accessibilityRole` and `accessibilityHint` for what pressing does.
   */
  onPress?: () => void;
  /** Draws the focused look without focus (e.g. while the menu a pressable field opened is showing) */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT = 56;
const LABEL_SCALE = 12 / 16; // bodyLarge label shrinks to bodySmall

// M3 text field, filled or outlined, 56dp tall. The label sits in the field (bodyLarge) and floats up
// (bodySmall) when focused or filled. Filled: surfaceContainerHighest with 4dp top corners and an
// indicator line (1dp, 2dp primary when focused). Outlined: 4dp corners, 1dp outline, 2dp primary when
// focused, with the label cut into the outline. Supporting or error text below in bodySmall.
export const TextField: FC<TextFieldProps> = ({
  label, mode = 'filled', supportingText, error = false, errorText, leadingIcon, trailingIcon, onTrailingIconPress,
  trailingIconAccessibilityLabel, disabled = false, backgroundColor, prefixText, suffixText, minHeight, maxHeight, autoGrow = true,
  onPress, active = false, style, value, defaultValue, onFocus, onBlur, onChangeText,
  ...inputProps
}) => {
  const { colors, fonts, shape, spacing, size, state, motion, reducedMotion, fontScaleCaps } = useTheme();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(defaultValue ?? '');
  const shown = value ?? text;
  const lit = focused || active;
  const floated = lit || shown.length > 0;
  const multiline = !!inputProps.multiline;
  const fieldHeight = multiline ? Math.max(minHeight ?? HEIGHT, HEIGHT) : HEIGHT;
  const float = useSharedValue(floated ? 1 : 0);

  useEffect(() => {
    float.value = reducedMotion ? (floated ? 1 : 0) : withTiming(floated ? 1 : 0, { duration: motion.duration.short4, easing: motion.easing.standard });
  }, [floated, reducedMotion, float, motion]);

  const filled = mode === 'filled';
  const disabledContent = withOpacity(colors.onSurface, state.disabledContent);
  const accent = disabled ? disabledContent : error ? colors.error : lit ? colors.primary : null;
  const labelColor = accent ?? colors.onSurfaceVariant;
  const lineColor = accent ?? (filled ? colors.onSurfaceVariant : colors.outline);
  const lineWidth = lit && !disabled ? 2 : 1;
  const iconColor = disabled ? disabledContent : colors.onSurfaceVariant;
  const startInset = leadingIcon !== undefined ? 52 : spacing.large;

  // Label: resting in the middle of the field; floated near the top (filled) or onto the outline (outlined)
  const restingTop = (HEIGHT - fonts.bodyLarge.lineHeight) / 2;
  const floatedTop = filled ? spacing.med : -fonts.bodyLarge.lineHeight / 2;
  const labelStyle = useAnimatedStyle(() => ({
    top: interpolate(float.value, [0, 1], [restingTop, floatedTop]),
    transform: [{ scale: interpolate(float.value, [0, 1], [1, LABEL_SCALE]) }],
  }));
  const message = error && errorText ? errorText : supportingText;
  // Multiline fields start the text at the top, level with the resting label; single-line text is centered
  const growing = multiline && autoGrow;
  const textTop = filled ? spacing.largeIncreased + spacing.small : multiline ? restingTop : 0;
  const textBottom = filled ? spacing.med : multiline ? restingTop : 0;
  const startPad = leadingIcon !== undefined ? spacing.medLarge : spacing.large;
  const pressable = onPress !== undefined && !disabled;
  const affix = (text: string, side: 'start' | 'end') => (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        alignSelf: multiline ? 'flex-start' : 'stretch',
        justifyContent: multiline ? 'flex-start' : 'center',
        paddingTop: textTop,
        paddingBottom: textBottom,
        opacity: floated ? 1 : 0,
        ...(side === 'start'
          ? { paddingLeft: startPad, paddingRight: spacing.xsmall }
          : { paddingLeft: spacing.xsmall, paddingRight: trailingIcon !== undefined ? 0 : spacing.large }),
      }}
    >
      <Text variant="bodyLarge" style={{ color: iconColor }}>{text}</Text>
    </View>
  );

  return (
    <View style={style}>
      <View
        style={{
          ...(growing ? { minHeight: fieldHeight, maxHeight } : { height: fieldHeight }),
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: filled ? (disabled ? withOpacity(colors.onSurface, 0.04) : colors.surfaceContainerHighest) : 'transparent',
          borderTopLeftRadius: shape.corner.extraSmall,
          borderTopRightRadius: shape.corner.extraSmall,
          borderBottomLeftRadius: filled ? 0 : shape.corner.extraSmall,
          borderBottomRightRadius: filled ? 0 : shape.corner.extraSmall,
          ...(filled ? { borderBottomWidth: lineWidth, borderColor: lineColor } : { borderWidth: lineWidth, borderColor: lineColor }),
        }}
      >
        {leadingIcon !== undefined && <Icon source={leadingIcon} size={size.icon.medium} color={iconColor} style={{ marginLeft: spacing.medLarge }} />}
        {prefixText !== undefined && affix(prefixText, 'start')}
        <TextInput
          {...inputProps}
          value={value}
          defaultValue={defaultValue}
          editable={!disabled && onPress === undefined}
          importantForAccessibility={onPress !== undefined ? 'no-hide-descendants' : inputProps.importantForAccessibility}
          accessibilityLabel={inputProps.accessibilityLabel ?? [label, prefixText, suffixText].filter(Boolean).join(', ')}
          accessibilityState={{ disabled }}
          maxFontSizeMultiplier={fontScaleCaps.body}
          onChangeText={next => { setText(next); onChangeText?.(next); }}
          onFocus={event => { setFocused(true); onFocus?.(event); }}
          onBlur={event => { setFocused(false); onBlur?.(event); }}
          placeholder={floated ? inputProps.placeholder : undefined}
          placeholderTextColor={colors.onSurfaceVariant}
          cursorColor={error ? colors.error : colors.primary}
          selectionColor={withOpacity(error ? colors.error : colors.primary, 0.4)}
          style={[fonts.bodyLarge, {
            flex: 1,
            height: growing ? undefined : '100%',
            maxHeight: growing ? maxHeight : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
            color: disabled ? disabledContent : colors.onSurface,
            paddingLeft: prefixText !== undefined ? 0 : startPad,
            paddingRight: trailingIcon !== undefined || suffixText !== undefined ? 0 : spacing.large,
            paddingTop: textTop,
            paddingBottom: textBottom,
          }]}
        />
        {suffixText !== undefined && affix(suffixText, 'end')}
        {trailingIcon !== undefined && (
          <IconButton icon={trailingIcon} iconColor={error && !disabled ? colors.error : iconColor} onPress={onTrailingIconPress} disabled={disabled} accessibilityLabel={trailingIconAccessibilityLabel} style={{ marginHorizontal: spacing.small }} />
        )}
        <Animated.View
          pointerEvents="none"
          style={[{
            position: 'absolute',
            left: startInset - (filled ? 0 : spacing.small),
            transformOrigin: 'left center',
            paddingHorizontal: filled ? 0 : spacing.small,
            backgroundColor: filled ? 'transparent' : floated ? backgroundColor ?? colors.surface : 'transparent',
          }, labelStyle]}
        >
          <Text variant="bodyLarge" numberOfLines={1} accessible={false} style={{ color: labelColor }}>{label}</Text>
        </Animated.View>
        {pressable && (
          <Pressable
            onPress={onPress}
            accessibilityRole={inputProps.accessibilityRole ?? 'button'}
            accessibilityLabel={[label, shown].filter(Boolean).join(', ')}
            accessibilityHint={inputProps.accessibilityHint}
            accessibilityState={{ expanded: active }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
        )}
      </View>
      {message !== undefined && (
        <Text variant="bodySmall" style={{ color: error && !disabled ? colors.error : iconColor, marginTop: spacing.small, paddingHorizontal: spacing.large }}>{message}</Text>
      )}
    </View>
  );
};
