import { FC, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export interface ListItemProps {
  headline: string;
  supportingText?: string;
  overline?: string;
  leadingIcon?: IconSource;
  leading?: ReactNode;      // anything else at the start (avatar, image, checkbox); wins over leadingIcon
  trailingText?: string;    // e.g. "100+" or a time
  trailing?: ReactNode;     // anything else at the end (switch, icon button, checkbox); wins over trailingText
  supportingLines?: 1 | 2;  // supporting text lines before it's cut off; 2 makes a three-line item
  onPress?: () => void;     // makes the whole row one button
  disabled?: boolean;
  selected?: boolean;       // M3 Expressive selected item: secondaryContainer background
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

// M3 list item: one line (56dp), two lines (72dp) or three lines (88dp), 16dp side padding.
// Headline in bodyLarge, supporting text in bodyMedium, overline and trailing text in labelSmall.
export const ListItem: FC<ListItemProps> = ({
  headline, supportingText, overline, leadingIcon, leading, trailingText, trailing, supportingLines = 1,
  onPress, disabled = false, selected = false, accessibilityLabel, accessibilityHint, style,
}) => {
  const { colors, spacing, size, state, shape } = useTheme();
  const lines = 1 + (supportingText || overline ? 1 : 0) + (supportingLines === 2 && supportingText ? 1 : 0);
  const minHeight = lines === 1 ? 56 : lines === 2 ? 72 : 88;
  const dim = (color: string) => (disabled ? withOpacity(colors.onSurface, state.disabledContent) : color);

  const content = (
    <>
      {leading ?? (leadingIcon !== undefined && <Icon source={leadingIcon} size={size.icon.medium} color={dim(colors.onSurfaceVariant)} />)}
      <View style={{ flex: 1, marginLeft: leading || leadingIcon !== undefined ? spacing.large : 0 }}>
        {overline && <Text variant="labelSmall" style={{ color: dim(colors.onSurfaceVariant) }}>{overline}</Text>}
        <Text variant="bodyLarge" style={{ color: dim(selected ? colors.onSecondaryContainer : colors.onSurface) }}>{headline}</Text>
        {supportingText && <Text variant="bodyMedium" numberOfLines={supportingLines} style={{ color: dim(colors.onSurfaceVariant) }}>{supportingText}</Text>}
      </View>
      {trailing ?? (trailingText && <Text variant="labelSmall" style={{ marginLeft: spacing.large, color: dim(colors.onSurfaceVariant) }}>{trailingText}</Text>)}
    </>
  );
  const rowStyle: ViewStyle = {
    minHeight,
    flexDirection: 'row',
    alignItems: lines === 3 ? 'flex-start' : 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: lines === 3 ? spacing.medLarge : spacing.med,
  };
  const selectedShape: ViewStyle = selected ? { backgroundColor: colors.secondaryContainer, borderRadius: shape.corner.large } : {};

  if (!onPress) {
    return <View style={[rowStyle, selectedShape, style]}>{content}</View>;
  }
  return (
    <TouchableRipple
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? [overline, headline, supportingText, trailingText].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected }}
      containerStyle={style}
      shapeStyle={selectedShape}
      style={rowStyle}
    >
      {content}
    </TouchableRipple>
  );
};
