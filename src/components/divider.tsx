import { FC } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface DividerProps {
  bold?: boolean; // 1dp line instead of a hairline
  style?: StyleProp<ViewStyle>;
}

// M3 divider: a thin outlineVariant line separating content
export const Divider: FC<DividerProps> = ({ bold = false, style }) => {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height: bold ? 1 : StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant }, style]}
    />
  );
};
