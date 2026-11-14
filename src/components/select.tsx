import { FC, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { IconSource } from '../icons/IconProvider';
import { GlyphIcon } from './glyphs';
import { Menu } from './menu';
import { TextField } from './textField';

export interface SelectOption {
  label: string;
  value: string;
  icon?: IconSource;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  value?: string;                       // the chosen option's value; undefined shows no choice
  onSelect: (value: string) => void;
  options: SelectOption[];
  mode?: 'filled' | 'outlined';         // default 'filled'
  supportingText?: string;
  error?: boolean;
  errorText?: string;
  leadingIcon?: IconSource;
  disabled?: boolean;
  /** Outlined fields: the color behind the field, so the floating label's cut-out matches. Default surface. */
  backgroundColor?: string;
  expandIcon?: IconSource;              // replaces the built-in arrow shown while the menu is closed
  collapseIcon?: IconSource;            // replaces the built-in arrow shown while the menu is open
  accessibilityHint?: string;           // default "Opens a list of options"
  style?: StyleProp<ViewStyle>;
}

// M3 exposed dropdown menu: a TextField that shows the chosen option and opens a Menu as wide as the field.
// The arrow is built in; `expandIcon` and `collapseIcon` swap in the app's own. The chosen option is marked selected in the menu. The field shows the focused look while the menu is open.
export const Select: FC<SelectProps> = ({
  label, value, onSelect, options, mode = 'filled', supportingText, error = false, errorText, leadingIcon, disabled = false,
  backgroundColor, expandIcon, collapseIcon, accessibilityHint = 'Opens a list of options', style,
}) => {
  const { colors, state } = useTheme();
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState<number>();
  const chosen = options.find(option => option.value === value);
  const arrowColor = disabled ? withOpacity(colors.onSurface, state.disabledContent) : error ? colors.error : colors.onSurfaceVariant;

  return (
    <View style={style} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        style={width !== undefined ? { minWidth: width, maxWidth: width } : undefined}
        items={options.map(option => ({
          label: option.label,
          icon: option.icon,
          disabled: option.disabled,
          selected: option.value === value,
          onPress: () => onSelect(option.value),
        }))}
        anchor={
          <TextField
            label={label}
            mode={mode}
            value={chosen?.label ?? ''}
            supportingText={supportingText}
            error={error}
            errorText={errorText}
            leadingIcon={leadingIcon}
            trailingIcon={open
              ? <GlyphIcon name="arrowDropUp" source={collapseIcon} size={24} color={arrowColor} />
              : <GlyphIcon name="arrowDropDown" source={expandIcon} size={24} color={arrowColor} />}
            disabled={disabled}
            backgroundColor={backgroundColor}
            active={open}
            onPress={() => setOpen(true)}
            accessibilityRole="combobox"
            accessibilityHint={accessibilityHint}
          />
        }
      />
    </View>
  );
};
