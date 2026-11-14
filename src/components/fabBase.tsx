import { useState, useRef, useEffect } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { Icon, IconSource } from '../icons/IconProvider';
import { Text } from './text';
import { TouchableRipple } from './touchableRipple';
import { useTheme } from '../theme/ThemeProvider';
import { scheduleOnRN } from 'react-native-worklets';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

// M3 FAB color styles: filled (primary/secondary/tertiary) or tonal containers
export type FABVariant = 'primary' | 'secondary' | 'tertiary' | 'primaryContainer' | 'secondaryContainer' | 'tertiaryContainer';

export interface FABBaseProps {
  animationDirection?: 'none' | 'top' | 'bottom' | 'left' | 'right',
  visible?: boolean,
  offScreen?: boolean,
  onPress: () => void,
  icon: IconSource,
  label: string, // read by screen readers, e.g. 'Settings'; shown beside the icon when `extended` is set
  variant?: FABVariant,
  /**
   * Gives the FAB a visible label: true shows it next to the icon (M3 extended FAB), false collapses it to the
   * icon-only square. Leave it out for a plain FAB. Changing it animates the width.
   */
  extended?: boolean,
}

// The M3 Expressive FAB (theme size.fab container, medium icon, "large" corners) behind FAB, ExtendedFAB and
// FABMenu. It slides/fades in from `animationDirection` when `visible` (instant with reduced motion), and it
// widens to show its label when `extended`. It can't be pressed until its entrance finishes.
export const FABBase = ({
  animationDirection = 'none',
  visible = true,
  offScreen = false,
  onPress,
  icon,
  label,
  variant = 'secondary',
  extended,
}: FABBaseProps) => {
  //Component State & Setup
  const { elevation, colors, motion, shape, size, spacing, reducedMotion } = useTheme();

  const [totalHeight, setTotalHeight] = useState<number>(1);
  const [totalWidth, setTotalWidth] = useState<number>(1);
  // A FAB that isn't animating in is ready at once
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(!(animationDirection === 'none' && visible));
  const offScreenTranslation = useRef<number>(0);

  const surfaceOpacity = useSharedValue<number>(
    animationDirection === 'none' || reducedMotion ? 1 : 0,
  );
  const translateSurface = useSharedValue<number>(0);

  // Extended: the container grows from the icon-only square to icon + gap + label, 16dp padding each side
  const [labelWidth, setLabelWidth] = useState(0);
  const expand = useSharedValue<number>(extended ? 1 : 0);
  useEffect(() => {
    const target = extended ? 1 : 0;
    expand.value = reducedMotion ? target : withSpring(target, motion.spring.defaultSpatial);
  }, [extended, reducedMotion, expand, motion.spring.defaultSpatial]);
  const extra = spacing.med + labelWidth;
  const widthStyle = useAnimatedStyle(() => ({ width: size.fab + expand.value * extra }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: expand.value }));

  //Functions
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (totalWidth !== width) setTotalWidth(width);
    if (totalHeight !== height) setTotalHeight(height);
  };

  const toggleButtonDisabled = (force?: boolean) => setButtonDisabled((prev) => {
    return typeof force === 'undefined' ? !prev : force;
  });

  const updateVisibilty = () => {
    if (reducedMotion) {
      surfaceOpacity.value = 1;
      translateSurface.value = 0;
      if (buttonDisabled) toggleButtonDisabled(false);
      return;
    }

    if (visible) {
      surfaceOpacity.value = withTiming(1, {
        duration: motion.duration.long2,
        easing: motion.easing.emphasizedDecelerate,
      }, (finished) => { if (finished) scheduleOnRN(toggleButtonDisabled, false) });
      translateSurface.value = withSpring(0, motion.spring.slowSpatial);
    } else {
      toggleButtonDisabled(true);
      surfaceOpacity.value = withTiming(0, {
        duration: motion.duration.medium1,
        easing: motion.easing.emphasizedAccelerate,
      });
      translateSurface.value = withTiming(offScreenTranslation.current, {
        duration: motion.duration.medium2,
        easing: motion.easing.emphasizedAccelerate,
      });
    }
  }

  //On Mount
  useEffect(() => {
    switch (animationDirection) {
      case 'bottom':
        offScreenTranslation.current = offScreen ? totalHeight : totalHeight * 0.25;
        break;
      case 'top':
        offScreenTranslation.current = offScreen ? -totalHeight : -(totalHeight * 0.25);
        break;
      case 'left':
        offScreenTranslation.current = offScreen ? -totalWidth : -(totalWidth * 0.25);
        break;
      case 'right':
        offScreenTranslation.current = offScreen ? totalWidth : totalWidth * 0.25;
        break;
    }

    if (!visible) updateVisibilty();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute the off-screen offset only when the measured size changes
  }, [totalWidth, totalHeight]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- animate only when visibility or the motion setting changes
  useEffect(updateVisibilty, [visible, reducedMotion]);

  const animationStyle = useAnimatedStyle(() => {
    if (animationDirection === 'bottom' || animationDirection === 'top') {
      return {
        transform: [{ translateY: translateSurface.value }],
        opacity: surfaceOpacity.value,
      };
    } else {
      return {
        transform: [{ translateX: translateSurface.value }],
        opacity: surfaceOpacity.value,
      };
    }
  });

  const palette: Record<FABVariant, { container: string, content: string }> = {
    primary: { container: colors.primary, content: colors.onPrimary },
    secondary: { container: colors.secondary, content: colors.onSecondary },
    tertiary: { container: colors.tertiary, content: colors.onTertiary },
    primaryContainer: { container: colors.primaryContainer, content: colors.onPrimaryContainer },
    secondaryContainer: { container: colors.secondaryContainer, content: colors.onSecondaryContainer },
    tertiaryContainer: { container: colors.tertiaryContainer, content: colors.onTertiaryContainer },
  };
  const { container, content } = palette[variant];

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        { height: size.fab, borderRadius: shape.corner.large, backgroundColor: container, ...elevation.level3 },
        extended === undefined ? { width: size.fab } : widthStyle,
        animationStyle,
      ]}
    >
      {/* Inner wrapper clips the ripple to the rounded shape without clipping the shadow */}
      <Animated.View style={{ flex: 1, borderRadius: shape.corner.large, overflow: 'hidden' }}>
        <TouchableRipple
          onPress={() => onPress()}
          disabled={buttonDisabled}
          rippleColor={content}
          accessibilityLabel={label}
          accessibilityState={{ disabled: buttonDisabled }}
          style={extended === undefined
            ? { flex: 1, alignItems: 'center', justifyContent: 'center' }
            : { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.large }}
        >
          <Icon source={icon} color={content} size={size.icon.medium} />
          {extended !== undefined && (
            <Animated.View style={[{ marginLeft: spacing.med, width: labelWidth > 0 ? labelWidth : undefined }, labelStyle]}>
              <Text variant="titleMedium" numberOfLines={1} accessible={false} style={{ color: content }}>{label}</Text>
            </Animated.View>
          )}
        </TouchableRipple>
        {extended !== undefined && (
          // Measures the label at its natural width (the visible one is clipped by the FAB's own width)
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ position: 'absolute', left: 0, top: 0, width: 1000, flexDirection: 'row', opacity: 0 }}
          >
            <Text variant="titleMedium" onLayout={event => setLabelWidth(Math.ceil(event.nativeEvent.layout.width))}>{label}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};
