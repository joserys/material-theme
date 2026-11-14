
import { FC, ReactNode, useState, useEffect } from "react";
import { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { useTheme } from '../theme/ThemeProvider';

import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withSequence } from "react-native-reanimated";

interface AnimatedViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  animationDirection?: 'none' | 'top' | 'bottom' | 'left' | 'right'; // the side it slides in from
  visible?: boolean;
  offScreen?: boolean; // starts and ends fully off screen instead of a quarter of its size away
}

// Fades and slides its content in from `animationDirection` when `visible`, out when not.
// With Reduce Motion it simply shows or hides.
export const AnimatedView: FC<AnimatedViewProps> = ({ children, style = {}, animationDirection = 'none', visible = true, offScreen = false }) => {
  //Component State & Setup
  const { motion, reducedMotion } = useTheme();

  const [totalHeight, setTotalHeight] = useState<number>(1);
  const [totalWidth, setTotalWidth] = useState<number>(1);

  const surfaceOpacity = useSharedValue<number>(animationDirection === 'none' ? 1 : 0);
  const translateSurface = useSharedValue<number>(0);

  //Functions
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (totalWidth !== width) setTotalWidth(width);
    if (totalHeight !== height) setTotalHeight(height);
  };

  //On Mount
	 useEffect(() => {
    if (reducedMotion) {
      surfaceOpacity.value = visible ? 1 : 0;
      translateSurface.value = 0;
      return;
    }
    let offScreenTranslation = 0;
    switch (animationDirection) {
      case 'bottom':
        offScreenTranslation = totalHeight * 0.25;
        break;
      case 'top':
        offScreenTranslation = -(totalHeight * 0.25);
        break;
      case 'left':
        offScreenTranslation = -(totalWidth * 0.25);
        break;
      case 'right':
        offScreenTranslation = totalWidth * 0.25;
        break;
    }

    // Delays use withDelay (timed on the UI thread) instead of setTimeout, so a busy JS thread can't hold them up
    if (visible) {
      if (offScreen) translateSurface.value = offScreenTranslation;

      const enterDelay = offScreen ? 0 : motion.duration.medium2;
      surfaceOpacity.value = withDelay(enterDelay, withTiming(1, { duration: motion.duration.long2, easing: motion.easing.emphasizedDecelerate }));
      translateSurface.value = withDelay(enterDelay, withSpring(0, motion.spring.slowSpatial));
    } else {
      surfaceOpacity.value = withTiming(0, { duration: motion.duration.medium1, easing: motion.easing.emphasizedAccelerate });
      const exit = withTiming(offScreenTranslation, { duration: motion.duration.medium2, easing: motion.easing.emphasizedAccelerate });

      // Off-screen views then jump fully out of view once the exit has played
      translateSurface.value = offScreen
        ? withSequence(exit, withDelay(motion.duration.long2 - motion.duration.medium2, withTiming(offScreenTranslation / .25, { duration: 0 })))
        : exit;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- animate only when visibility, the measured size or the motion setting changes
  }, [visible, totalWidth, totalHeight, reducedMotion]);

  const animationStyle = useAnimatedStyle(() => {
    if (animationDirection === 'bottom' || animationDirection === 'top') {
      return {
        transform: [{ translateY: translateSurface.value }],
        opacity: surfaceOpacity.value
      }
    } else {
      return {
        transform: [{ translateX: translateSurface.value }],
        opacity: surfaceOpacity.value
      }
    }
  });

	return (
		<Animated.View style={ animationDirection === 'none' ? style : [style, animationStyle] } onLayout={ handleLayout }>
			{ children }
		</Animated.View>
	);
}