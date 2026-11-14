import { FC } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { NavigationDestination, NavigationItem } from './navigationItem';

export interface NavigationBarProps {
  destinations: NavigationDestination[]; // M3: three to five
  value: string;                         // the selected destination's key
  onValueChange: (key: string) => void;
  safeArea?: boolean;                    // pads for the home indicator (default true)
  style?: StyleProp<ViewStyle>;
}

// M3 Expressive navigation bar for phones: 64dp on surfaceContainer at the bottom of the screen, with the
// destinations spread evenly.
export const NavigationBar: FC<NavigationBarProps> = ({ destinations, value, onValueChange, safeArea = true, style }) => {
  const { colors } = useTheme();
  const { bottom, left, right } = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[{
        flexDirection: 'row',
        backgroundColor: colors.surfaceContainer,
        minHeight: 64 + (safeArea ? bottom : 0),
        paddingBottom: safeArea ? bottom : 0,
        paddingLeft: safeArea ? left : 0,
        paddingRight: safeArea ? right : 0,
      }, style]}
    >
      {destinations.map(destination => (
        <NavigationItem key={destination.key} destination={destination} selected={destination.key === value} onPress={() => onValueChange(destination.key)} />
      ))}
    </View>
  );
};
