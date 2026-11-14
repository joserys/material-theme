import { FC, ReactNode } from 'react';
import { LayoutChangeEvent, ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from '../theme/ThemeProvider';

interface ScreenLayoutProps {
  children?: ReactNode;
  scrollingActive?: boolean; // scrolls its content
  viewControl?: ViewStyle;    // overrides for the (scrolling) container
  spacingControl?: ViewStyle; // overrides for the padding (safe area + spacing.xlarge on every side)
  onLayout?: (event: LayoutChangeEvent) => void;
}

// A screen's content area: inside the safe area, padded spacing.xlarge, optionally scrolling
export const ScreenLayout: FC<ScreenLayoutProps> = ({ children, scrollingActive = false, viewControl = {}, spacingControl = {}, onLayout }) => {
  const { spacing } = useTheme();
  const { top, bottom, left, right } = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
  	position: 'absolute',
  	overflow: 'hidden',
  	bottom: 0,
  	top: 0,
  	left: 0,
  	right: 0,
  	...viewControl
  }

  const spacingStyle: ViewStyle = {
  	paddingTop: top + spacing.xlarge,
  	paddingBottom: bottom + spacing.xlarge,
  	paddingLeft: left + spacing.xlarge,
  	paddingRight: right + spacing.xlarge,
  	...spacingControl
  }

  if (scrollingActive) {
		return (
			<View style={ containerStyle } onLayout={ onLayout }>
				<ScrollView contentContainerStyle={ spacingStyle }>
					{ children }
				</ScrollView>
			</View>
		);
  } else {
  	return (
			<View style={[{ flex: 1 }, spacingStyle]} onLayout={onLayout}>
				{ children }
			</View>
		);
  }
}