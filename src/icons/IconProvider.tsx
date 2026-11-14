/**
 * @fileoverview Pluggable icons: the app decides what every icon name draws.
 *
 * @description
 * Every component that shows an icon takes an IconSource:
 * - a name ('settings'), looked up in IconProvider's `icons`, then its `fallback` (e.g. an icon font),
 * - a render function ({ size, color }) => <MySvg ... />, drawn as is,
 * - or a ready element (<MySvg />), shown as given (it doesn't get the component's size or color).
 *
 * @examples
 * <IconProvider icons={{ logo: ({ size, color }) => <Logo width={size} height={size} fill={color} /> }}
 *               fallback={materialDesignIcons}>
 *   <App />
 * </IconProvider>
 * <Button icon="logo">Start</Button>
 */

import { createContext, FC, isValidElement, ReactElement, ReactNode, useContext } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface IconRenderProps {
  size: number;
  color: string;
}

export type IconRender = (props: IconRenderProps) => ReactNode;

/** An icon name, a render function, or a ready element */
export type IconSource = string | IconRender | ReactElement;

/** Draws any name not in `icons`, e.g. from an icon font; returns null when it doesn't know the name */
export type IconFallback = (name: string, props: IconRenderProps) => ReactNode;

interface IconSet {
  icons: Record<string, IconRender>;
  fallback?: IconFallback;
}

const IconState = createContext<IconSet>({ icons: {} });

interface IconProviderProps {
  icons?: Record<string, IconRender>;
  fallback?: IconFallback;
  children: ReactNode;
}

// Keep `icons` and `fallback` stable (define them outside the component)
export const IconProvider: FC<IconProviderProps> = ({ icons = {}, fallback, children }) => (
  <IconState.Provider value={{ icons, fallback }}>{children}</IconState.Provider>
);

export interface IconProps {
  source: IconSource;
  size?: number;
  color?: string; // defaults to onSurface
  style?: StyleProp<ViewStyle>;
}

const warned = new Set<string>();

// An icon in the theme's content color. Decorative (hidden from screen readers); give the surrounding
// control an accessibilityLabel instead.
export const Icon: FC<IconProps> = ({ source, size = 24, color, style }) => {
  const { colors } = useTheme();
  const { icons, fallback } = useContext(IconState);
  const props = { size, color: color ?? colors.onSurface };

  let drawn: ReactNode = null;
  if (typeof source === 'function') drawn = source(props);
  else if (isValidElement(source)) drawn = source;
  else if (typeof source === 'string') {
    drawn = icons[source]?.(props) ?? fallback?.(source, props) ?? null;
    if (drawn === null && __DEV__ && !warned.has(source)) {
      warned.add(source);
      console.warn(`[Icon] No icon named "${source}". Add it to IconProvider's icons or fallback.`);
    }
  }

  return (
    <View
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {drawn}
    </View>
  );
};
