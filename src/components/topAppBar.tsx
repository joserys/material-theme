import { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import type { IconSource } from '../icons/IconProvider';
import type { TypescaleVariant } from '../theme/types';
import { IconButton } from './iconButton';
import { Text } from './text';

export type TopAppBarVariant = 'small' | 'center' | 'medium' | 'large';

export interface TopAppBarAction {
  icon: IconSource;
  onPress: () => void;
  accessibilityLabel: string;
}

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  variant?: TopAppBarVariant;           // default 'small'
  navigation?: TopAppBarAction;         // leading button, e.g. back or menu
  actions?: TopAppBarAction[];          // trailing buttons; M3 allows up to three
  scrolled?: boolean;                   // content scrolled under it: switches to surfaceContainer
  safeArea?: boolean;                   // pads for the status bar / notch (default true)
  style?: StyleProp<ViewStyle>;
}

// M3 Expressive top app bars: small (64dp, titleLarge), center-aligned (64dp, centered titleLarge),
// medium flexible (112dp, headlineMedium) and large flexible (120dp, displaySmall), each a little taller
// with a subtitle. Surface color, surfaceContainer once content scrolls under it.
const SPEC: Record<TopAppBarVariant, { height: number; withSubtitle: number; title: TypescaleVariant; subtitle: TypescaleVariant }> = {
  small: { height: 64, withSubtitle: 64, title: 'titleLarge', subtitle: 'labelMedium' },
  center: { height: 64, withSubtitle: 64, title: 'titleLarge', subtitle: 'labelMedium' },
  medium: { height: 112, withSubtitle: 136, title: 'headlineMedium', subtitle: 'labelLarge' },
  large: { height: 120, withSubtitle: 152, title: 'displaySmall', subtitle: 'titleMedium' },
};

export const TopAppBar: FC<TopAppBarProps> = ({ title, subtitle, variant = 'small', navigation, actions = [], scrolled = false, safeArea = true, style }) => {
  const { colors, spacing } = useTheme();
  const { top, left, right } = useSafeAreaInsets();
  const spec = SPEC[variant];
  const tall = variant === 'medium' || variant === 'large';
  const centered = variant === 'center';
  const sideWidth = Math.max(navigation ? 1 : 0, actions.length) * 40;

  const titleBlock = (
    <View style={{ flex: tall || centered ? undefined : 1, alignItems: centered ? 'center' : 'flex-start', paddingHorizontal: navigation && !tall && !centered ? 0 : spacing.large }}>
      <Text variant={spec.title} numberOfLines={tall ? 2 : 1} accessibilityRole="header">{title}</Text>
      {subtitle && <Text variant={spec.subtitle} numberOfLines={1} style={{ color: colors.onSurfaceVariant }}>{subtitle}</Text>}
    </View>
  );
  const button = (action: TopAppBarAction, color: string) => (
    <IconButton key={action.accessibilityLabel} icon={action.icon} onPress={action.onPress} accessibilityLabel={action.accessibilityLabel} iconColor={color} style={{ margin: 0 }} />
  );

  return (
    <View
      style={[{
        backgroundColor: scrolled ? colors.surfaceContainer : colors.surface,
        paddingTop: safeArea ? top : 0,
        paddingLeft: (safeArea ? left : 0) + spacing.small,
        paddingRight: (safeArea ? right : 0) + spacing.small,
        minHeight: (subtitle ? spec.withSubtitle : spec.height) + (safeArea ? top : 0),
        paddingBottom: tall ? spacing.large : 0,
      }, style]}
    >
      <View style={{ height: 64, flexDirection: 'row', alignItems: 'center' }}>
        {/* Centered titles sit over the whole row, kept clear of the wider of the two button groups */}
        {centered && (
          <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, bottom: 0, left: sideWidth, right: sideWidth, justifyContent: 'center' }}>
            {titleBlock}
          </View>
        )}
        {navigation && button(navigation, colors.onSurface)}
        {tall || centered ? <View style={{ flex: 1 }} /> : titleBlock}
        {actions.map(action => button(action, colors.onSurfaceVariant))}
      </View>
      {tall && titleBlock}
    </View>
  );
};
