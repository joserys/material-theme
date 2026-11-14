import { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './text';

export interface BadgeProps {
  value?: number | string; // left out: the small dot. Numbers over `max` show as "999+".
  max?: number;            // default 999
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}

// M3 badge, in error colors with full corners: a 6dp dot, or a 16dp-tall label (labelSmall) for a count.
// Place it on an icon's top end corner; NavigationBar and NavigationRail do this for their items.
export const Badge: FC<BadgeProps> = ({ value, max = 999, visible = true, style }) => {
  const { colors, spacing } = useTheme();
  if (!visible) return null;
  if (value === undefined) {
    return <View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error }, style]} />;
  }
  const label = typeof value === 'number' && value > max ? `${max}+` : String(value);
  return (
    <View style={[{ minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: spacing.small, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text variant="labelSmall" numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ color: colors.onError, lineHeight: 16 }}>{label}</Text>
    </View>
  );
};
