import { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { RadioButton } from './radioButton';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export interface RadioGroupOption {
  value: string;
  label: string;
  supportingText?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  value?: string;                       // the selected option's value
  onValueChange: (value: string) => void;
  options: RadioGroupOption[];
  disabled?: boolean;                   // disables every option
  accessibilityLabel?: string;          // names the group for screen readers, e.g. "Activity level"
  style?: StyleProp<ViewStyle>;
}

// A group of labelled radio rows that keeps track of the selection: one option is selected, and the whole
// row (56dp, or 72dp with supporting text) is the tap target. Announced to screen readers as a radio group.
export const RadioGroup: FC<RadioGroupProps> = ({ value, onValueChange, options, disabled = false, accessibilityLabel, style }) => {
  const { colors, spacing, state } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={style}>
      {options.map(option => {
        const off = disabled || !!option.disabled;
        const selected = option.value === value;
        const dim = (color: string) => (off ? withOpacity(colors.onSurface, state.disabledContent) : color);
        return (
          <TouchableRipple
            key={option.value}
            onPress={() => onValueChange(option.value)}
            disabled={off}
            accessibilityRole="radio"
            accessibilityLabel={[option.label, option.supportingText].filter(Boolean).join(', ')}
            accessibilityState={{ checked: selected, disabled: off }}
            style={{ minHeight: option.supportingText ? 72 : 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.large, paddingVertical: spacing.med }}
          >
            <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <RadioButton selected={selected} disabled={off} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.med }}>
              <Text variant="bodyLarge" style={{ color: dim(colors.onSurface) }}>{option.label}</Text>
              {option.supportingText !== undefined && (
                <Text variant="bodyMedium" style={{ color: dim(colors.onSurfaceVariant) }}>{option.supportingText}</Text>
              )}
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
};
