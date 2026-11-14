import { FC, ReactNode } from 'react';
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import type { ElevationLevel } from '../theme/types';

interface SurfaceProps {
  children?: ReactNode;
  level?: 0 | 1 | 2 | 3 | 4 | 5; // M3 elevation: shadow plus the matching surface tint
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  onLayout?: (event: LayoutChangeEvent) => void;
}

// M3 surface: rounded (extraLarge corners), padded card at an elevation level
export const Surface: FC<SurfaceProps> = ({ children, level = 1, style, onLayout }) => {
	const key = `level${level}` as ElevationLevel;

	const { elevation, shape, spacing, colors } = useTheme();
	const requiredStyle = {
    padding: spacing.large,
    borderRadius: shape.corner.extraLarge,
    backgroundColor: colors.elevation[key],
    ...elevation[key]
	}

	return (
		<Animated.View style={[requiredStyle, style]} onLayout={ onLayout }>
			{ children }
		</Animated.View>
	);
}