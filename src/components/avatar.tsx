import { FC } from 'react';
import { Image, ImageSourcePropType, StyleProp, Text as NativeText, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface AvatarTextProps {
  label: string;          // usually 1-2 initials
  size?: number;
  color?: string;         // defaults to onPrimary
  backgroundColor?: string; // defaults to primary
  style?: StyleProp<ViewStyle>;
}

// Round avatar showing initials, used when there's no profile picture
export const AvatarText: FC<AvatarTextProps> = ({ label, size = 64, color, backgroundColor, style }) => {
  const { colors, fonts } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: backgroundColor ?? colors.primary, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <NativeText
        numberOfLines={1}
        style={{ fontFamily: fonts.titleMedium.fontFamily, fontWeight: fonts.titleMedium.fontWeight, fontSize: size / 2.5, color: color ?? colors.onPrimary }}
      >
        {label}
      </NativeText>
    </View>
  );
};


interface AvatarImageProps {
  source: ImageSourcePropType;
  size?: number;                // default theme size.avatar
  accessibilityLabel?: string;  // describes the picture for screen readers; without it the avatar is skipped as decoration
  backgroundColor?: string;     // shows while the image loads or if it has transparency; defaults to surfaceContainerHighest
  style?: StyleProp<ViewStyle>;
}

// Round avatar showing a picture (a profile photo or an app icon), cropped to a circle
export const AvatarImage: FC<AvatarImageProps> = ({ source, size, accessibilityLabel, backgroundColor, style }) => {
  const { colors, size: sizes } = useTheme();
  const diameter = size ?? sizes.avatar;
  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[{ width: diameter, height: diameter, borderRadius: diameter / 2, overflow: 'hidden', backgroundColor: backgroundColor ?? colors.surfaceContainerHighest }, style]}
    >
      <Image source={source} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" resizeMode="cover" style={{ width: diameter, height: diameter }} />
    </View>
  );
};
