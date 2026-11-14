import { FC, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { NavigationDestination, NavigationItem } from './navigationItem';

export interface NavigationRailProps {
  destinations: NavigationDestination[]; // M3: three to seven
  value: string;
  onValueChange: (key: string) => void;
  header?: ReactNode;                    // above the destinations, e.g. a menu button or a FAB
  align?: 'top' | 'center';              // where the destinations sit (default top)
  safeArea?: boolean;                    // pads for the status bar and the side notch (default true)
  style?: StyleProp<ViewStyle>;
}

const WIDTH = 96;

// M3 Expressive navigation rail (collapsed) for tablets and landscape: a 96dp column on the screen's start
// edge, on surface, with the destinations stacked.
export const NavigationRail: FC<NavigationRailProps> = ({ destinations, value, onValueChange, header, align = 'top', safeArea = true, style }) => {
  const { colors, spacing } = useTheme();
  const { top, bottom, left } = useSafeAreaInsets();
  return (
    <View
      style={[{
        width: WIDTH + (safeArea ? left : 0),
        paddingLeft: safeArea ? left : 0,
        paddingTop: (safeArea ? top : 0) + spacing.large,
        paddingBottom: (safeArea ? bottom : 0) + spacing.large,
        backgroundColor: colors.surface,
        alignItems: 'center',
      }, style]}
    >
      {header && <View style={{ marginBottom: spacing.xlarge, alignItems: 'center' }}>{header}</View>}
      <View accessibilityRole="tablist" style={{ flex: 1, justifyContent: align === 'center' ? 'center' : 'flex-start', gap: spacing.medLarge }}>
        {destinations.map(destination => (
          <NavigationItem key={destination.key} destination={destination} width={WIDTH} selected={destination.key === value} onPress={() => onValueChange(destination.key)} />
        ))}
      </View>
    </View>
  );
};
