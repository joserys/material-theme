import { FC, useEffect, useRef, useState } from 'react';
import { BackHandler, LayoutChangeEvent, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconSource } from '../icons/IconProvider';
import { FABBase, FABBaseProps, FABVariant } from './fabBase';
import { Portal } from './portal';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';

export interface FABMenuAction {
  icon: IconSource;
  label: string;
  onPress: () => void;
}

export interface FABMenuProps extends Pick<FABBaseProps, 'icon' | 'label' | 'animationDirection' | 'visible' | 'offScreen'> {
  open: boolean;
  onOpenChange: (open: boolean) => void; // tap the button, the scrim, or the back button
  openIcon?: IconSource;                 // the button while open; default "close"
  actions: FABMenuAction[];              // listed bottom to top, the first one nearest the button
  /** The closed button's color (default 'primaryContainer'). The open button and the actions use the same color family. */
  variant?: FABVariant;
  style?: StyleProp<ViewStyle>;          // the closed button's wrapper, e.g. its position
}

type Family = 'primary' | 'secondary' | 'tertiary';
const familyOf = (variant: FABVariant): Family => (variant.startsWith('secondary') ? 'secondary' : variant.startsWith('tertiary') ? 'tertiary' : 'primary');

interface Box { x: number; y: number; width: number; height: number }

const ITEM_HEIGHT = 56;

interface ItemProps {
  action: FABMenuAction;
  index: number;
  count: number;
  progress: SharedValue<number>;
  container: string;
  content: string;
  onChoose: () => void;
}

// One labelled action: a pill with an icon, rising into place after the items nearer the button
const Item: FC<ItemProps> = ({ action, index, count, progress, container, content, onChoose }) => {
  const { shape, spacing, size, elevation } = useTheme();
  const start = count > 1 ? (index / (count - 1)) * 0.5 : 0;
  const animated = useAnimatedStyle(() => {
    const local = interpolate(progress.value, [start, 1], [0, 1], 'clamp');
    return { opacity: local, transform: [{ translateY: (1 - local) * spacing.large }, { scale: 0.9 + local * 0.1 }] };
  });
  return (
    <Animated.View style={[{ height: ITEM_HEIGHT, borderRadius: shape.corner.full, backgroundColor: container, ...elevation.level3 }, animated]}>
      <View style={{ flex: 1, borderRadius: shape.corner.full, overflow: 'hidden' }}>
        <TouchableRipple
          onPress={onChoose}
          rippleColor={content}
          accessibilityLabel={action.label}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.large }}
        >
          <Icon source={action.icon} size={size.icon.medium} color={content} style={{ marginRight: spacing.med }} />
          <Text variant="titleMedium" numberOfLines={1} style={{ color: content }}>{action.label}</Text>
        </TouchableRipple>
      </View>
    </Animated.View>
  );
};

interface OverlayProps extends Pick<FABMenuProps, 'actions' | 'openIcon' | 'onOpenChange'> {
  label: string;
  anchor: Box;                    // where the closed button is, in window coordinates
  color: Family;
  progress: SharedValue<number>;
}

// The open menu, drawn over the whole screen: scrim, the stacked actions, and the open (close) button
// placed exactly where the closed button is
const Overlay: FC<OverlayProps> = ({ anchor, color, progress, actions, openIcon = 'close', label, onOpenChange }) => {
  const { colors, spacing } = useTheme();
  const rootRef = useRef<View>(null);
  const [frame, setFrame] = useState<{ originX: number; originY: number; width: number; height: number }>();

  // The overlay may not start at the window's corner, so measure it and place everything relative to it
  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    rootRef.current?.measureInWindow((originX, originY) => setFrame({ originX, originY, width, height }));
  };

  const palette = {
    primary: { container: colors.primaryContainer, content: colors.onPrimaryContainer },
    secondary: { container: colors.secondaryContainer, content: colors.onSecondaryContainer },
    tertiary: { container: colors.tertiaryContainer, content: colors.onTertiaryContainer },
  }[color];

  const scrimStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 1], [0, 1], 'clamp') }));
  const choose = (action: FABMenuAction) => {
    onOpenChange(false);
    action.onPress();
  };

  const x = frame ? anchor.x - frame.originX : 0;
  const y = frame ? anchor.y - frame.originY : 0;
  // Items line up with the button's edge on the side of the screen it sits on
  const alignEnd = frame !== undefined && x + anchor.width / 2 > frame.width / 2;

  return (
    <View ref={rootRef} collapsable={false} onLayout={measure} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, scrimStyle]}>
        <Pressable onPress={() => onOpenChange(false)} accessibilityRole="button" accessibilityLabel="Close menu" style={{ flex: 1 }} />
      </Animated.View>
      {frame !== undefined && (
        <>
          <View
            accessibilityViewIsModal
            style={{
              position: 'absolute',
              bottom: frame.height - y + spacing.med,
              ...(alignEnd ? { right: frame.width - x - anchor.width } : { left: x }),
              alignItems: alignEnd ? 'flex-end' : 'flex-start',
              flexDirection: 'column-reverse',
              gap: spacing.small,
            }}
          >
            {actions.map((action, index) => (
              <Item
                key={action.label}
                action={action}
                index={index}
                count={actions.length}
                progress={progress}
                container={palette.container}
                content={palette.content}
                onChoose={() => choose(action)}
              />
            ))}
          </View>
          <View style={{ position: 'absolute', left: x, top: y }}>
            <FABBase icon={openIcon} label={label} variant={color} onPress={() => onOpenChange(false)} />
          </View>
        </>
      )}
    </View>
  );
};

// FAB menu mode of FAB (also exported as FABMenu): the button opens a stack of labelled actions above it, over a
// scrim, and turns into a filled close button while open. The open menu is drawn through Portal so it covers
// the whole screen, with the button staying exactly where the FAB was. Items rise in one after another; they
// jump with Reduce Motion. Keep `open` in the app's state; the menu closes before an action's `onPress` runs.
export const MenuFAB: FC<FABMenuProps> = ({
  open, onOpenChange, icon, openIcon, actions, variant = 'primaryContainer', label, animationDirection, visible, offScreen, style,
}) => {
  const color = familyOf(variant);
  const { motion, size, reducedMotion } = useTheme();
  const ref = useRef<View>(null);
  const [anchor, setAnchor] = useState<Box>();
  const [mounted, setMounted] = useState(false);
  const progress = useSharedValue(0);

  // Opening: measure where the FAB is, then show the overlay. Closing: animate out, then remove it.
  useEffect(() => {
    if (open) {
      ref.current?.measureInWindow((x, y, width, height) => {
        setAnchor({ x, y, width, height });
        setMounted(true);
      });
      return;
    }
    if (reducedMotion) {
      progress.value = 0;
      setMounted(false);
      return;
    }
    progress.value = withTiming(0, { duration: motion.duration.short3, easing: motion.easing.emphasizedAccelerate },
      finished => { if (finished) scheduleOnRN(setMounted, false); });
  }, [open, reducedMotion, progress, motion]);

  useEffect(() => {
    if (!open || !mounted) return;
    progress.value = reducedMotion ? 1 : withSpring(1, motion.spring.defaultSpatial);
  }, [open, mounted, reducedMotion, progress, motion.spring.defaultSpatial]);

  // Android back button closes it
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { onOpenChange(false); return true; });
    return () => subscription.remove();
  }, [open, onOpenChange]);

  return (
    <>
      <View
        ref={ref}
        collapsable={false}
        pointerEvents={mounted ? 'none' : 'auto'}
        importantForAccessibility={mounted ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={mounted}
        style={[{ width: size.fab, height: size.fab, opacity: mounted ? 0 : 1 }, style]}
      >
        <FABBase icon={icon} label={label} variant={variant} animationDirection={animationDirection} visible={visible} offScreen={offScreen} onPress={() => onOpenChange(true)} />
      </View>
      <Portal>
        {anchor !== undefined && mounted ? (
          <Overlay anchor={anchor} color={color} progress={progress} actions={actions} openIcon={openIcon} label={label} onOpenChange={onOpenChange} />
        ) : null}
      </Portal>
    </>
  );
};
