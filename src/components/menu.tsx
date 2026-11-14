import { FC, Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { withOpacity } from '../util/color';
import { Icon, IconSource } from '../icons/IconProvider';
import { Divider } from './divider';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export interface MenuItem {
  label: string;
  onPress: () => void;
  icon?: IconSource;
  trailingText?: string; // e.g. a keyboard shortcut
  disabled?: boolean;
  selected?: boolean;    // M3 Expressive selected item: tertiaryContainer
}

export interface MenuProps {
  visible: boolean;
  onDismiss: () => void;           // tap outside, back button, or after an item is chosen
  anchor: ReactNode;               // what the menu opens from (e.g. an IconButton that sets visible)
  items: (MenuItem | 'divider')[];
  style?: StyleProp<ViewStyle>;    // the menu surface
}

const EDGE = 8; // closest the menu gets to the window's edges

// M3 Expressive menu: a surfaceContainer list with large (16dp) corners at elevation 2, 112-280dp wide,
// opening under its anchor (above it when there's no room) and kept inside the window. 48dp items with
// labelLarge text and optional 24dp leading icons. Unfolds from its anchor; jumps with Reduce Motion.
export const Menu: FC<MenuProps> = ({ visible, onDismiss, anchor, items, style }) => {
  const { colors, shape, spacing, elevation, size, state, motion, reducedMotion } = useTheme();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const anchorRef = useRef<View>(null);
  const [anchorBox, setAnchorBox] = useState<{ x: number; y: number; width: number; height: number }>();
  const [menuSize, setMenuSize] = useState<{ width: number; height: number }>();
  const open = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      setAnchorBox(undefined);
      setMenuSize(undefined);
      open.value = 0;
      return;
    }
    anchorRef.current?.measureInWindow((x, y, width, height) => setAnchorBox({ x, y, width, height }));
  }, [visible, open]);

  const placed = anchorBox !== undefined && menuSize !== undefined;
  useEffect(() => {
    if (!placed) return;
    open.value = reducedMotion ? 1 : withSpring(1, motion.spring.fastSpatial);
  }, [placed, reducedMotion, open, motion.spring.fastSpatial]);
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = placed ? (reducedMotion ? 1 : withTiming(1, { duration: motion.duration.short3 })) : 0;
  }, [placed, reducedMotion, fade, motion.duration.short3]);
  const menuStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scaleY: 0.8 + open.value * 0.2 }] }));

  // Below the anchor if it fits, otherwise above; never past the window's edges
  let top = 0;
  let left = 0;
  let fromBottom = false;
  if (placed) {
    const below = anchorBox.y + anchorBox.height;
    fromBottom = below + menuSize.height > window.height - insets.bottom - EDGE && anchorBox.y - menuSize.height > insets.top + EDGE;
    top = fromBottom ? anchorBox.y - menuSize.height : below;
    left = Math.min(Math.max(EDGE, anchorBox.x), window.width - menuSize.width - EDGE);
  }

  const choose = (item: MenuItem) => {
    onDismiss();
    item.onPress();
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>{anchor}</View>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent navigationBarTranslucent>
        <Pressable style={{ flex: 1 }} onPress={onDismiss} accessibilityLabel="Close menu" accessibilityRole="button" />
        <Animated.View
          onLayout={event => { if (!menuSize) setMenuSize(event.nativeEvent.layout); }}
          accessibilityRole="menu"
          style={[{
            position: 'absolute',
            top,
            left,
            minWidth: 112,
            maxWidth: 280,
            paddingVertical: spacing.small,
            borderRadius: shape.corner.large,
            backgroundColor: colors.surfaceContainer,
            transformOrigin: fromBottom ? 'bottom' : 'top',
            ...elevation.level2,
          }, menuStyle, style]}
        >
          {items.map((item, index) => {
            if (item === 'divider') return <Divider key={`divider-${index}`} style={{ marginVertical: spacing.small }} />;
            const content = item.disabled ? withOpacity(colors.onSurface, state.disabledContent) : item.selected ? colors.onTertiaryContainer : colors.onSurface;
            const iconColor = item.disabled ? content : item.selected ? colors.onTertiaryContainer : colors.onSurfaceVariant;
            return (
              <Fragment key={item.label}>
                <TouchableRipple
                  onPress={() => choose(item)}
                  disabled={item.disabled}
                  rippleColor={content}
                  accessibilityRole="menuitem"
                  accessibilityLabel={item.label}
                  accessibilityState={{ disabled: item.disabled, selected: item.selected }}
                  containerStyle={{ marginHorizontal: spacing.small }}
                  shapeStyle={{ borderRadius: shape.corner.medium, backgroundColor: item.selected ? colors.tertiaryContainer : undefined }}
                  style={{ height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.medLarge }}
                >
                  {item.icon !== undefined && <Icon source={item.icon} size={size.icon.medium} color={iconColor} style={{ marginRight: spacing.medLarge }} />}
                  <Text variant="labelLarge" numberOfLines={1} style={{ flex: 1, color: content }}>{item.label}</Text>
                  {item.trailingText && <Text variant="labelLarge" style={{ marginLeft: spacing.medLarge, color: iconColor }}>{item.trailingText}</Text>}
                </TouchableRipple>
              </Fragment>
            );
          })}
        </Animated.View>
      </Modal>
    </>
  );
};
