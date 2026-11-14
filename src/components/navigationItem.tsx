import { FC, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconSource } from '../icons/IconProvider';
import { Badge } from './badge';
import { Text } from './text';

export interface NavigationDestination {
  key: string;
  label: string;
  icon: IconSource;
  activeIcon?: IconSource;   // e.g. the filled version of the icon, shown while selected
  badge?: number | string | true; // true: a dot
  accessibilityLabel?: string;
}

interface NavigationItemProps {
  destination: NavigationDestination;
  selected: boolean;
  onPress: () => void;
  width?: number;
}

const INDICATOR_WIDTH = 56;
const INDICATOR_HEIGHT = 32;

// One destination in a navigation bar or rail: the icon in a 56x32 pill active indicator (secondaryContainer)
// that springs open when selected, with the label (labelMedium) below. Pressing shows the M3 state layer on the
// pill. Shared by NavigationBar and NavigationRail.
export const NavigationItem: FC<NavigationItemProps> = ({ destination, selected, onPress, width }) => {
  const { colors, motion, spacing, size, state, reducedMotion } = useTheme();
  const open = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    open.value = reducedMotion ? (selected ? 1 : 0) : withSpring(selected ? 1 : 0, motion.spring.fastSpatial);
  }, [selected, reducedMotion, open, motion.spring.fastSpatial]);
  const indicatorStyle = useAnimatedStyle(() => ({ opacity: open.value, transform: [{ scaleX: 0.5 + open.value / 2 }] }));

  const { label, icon, activeIcon, badge, accessibilityLabel } = destination;
  const badgeText = typeof badge === 'number' || typeof badge === 'string' ? `, ${badge} new` : badge ? ', new' : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={(accessibilityLabel ?? label) + badgeText}
      accessibilityState={{ selected }}
      style={{ width, flex: width === undefined ? 1 : undefined, minHeight: size.touchTarget, alignItems: 'center', paddingVertical: spacing.smallMed }}
    >
      {({ pressed }) => (
        <>
          <View style={{ width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, borderRadius: INDICATOR_HEIGHT / 2, backgroundColor: colors.secondaryContainer }, indicatorStyle]} />
            {/* Pressed state layer on the pill */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: INDICATOR_WIDTH, height: INDICATOR_HEIGHT, borderRadius: INDICATOR_HEIGHT / 2, backgroundColor: colors.onSurface, opacity: pressed ? state.pressed : 0 }} />
            <View>
              <Icon source={selected ? activeIcon ?? icon : icon} size={size.icon.medium} color={selected ? colors.onSecondaryContainer : colors.onSurfaceVariant} />
              {badge !== undefined && (
                <Badge value={badge === true ? undefined : badge} style={{ position: 'absolute', ...(badge === true ? { top: 0, right: -2 } : { top: -4, left: size.icon.medium / 2 + 4 }) }} />
              )}
            </View>
          </View>
          <Text variant={selected ? 'labelMediumEmphasized' : 'labelMedium'} numberOfLines={1} style={{ marginTop: spacing.small, color: selected ? colors.secondary : colors.onSurfaceVariant }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};
