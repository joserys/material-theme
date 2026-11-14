import { FC } from 'react';
import Svg, { Path } from 'react-native-svg';
import { Icon, IconSource } from '../icons/IconProvider';

// Marks a component always draws the same way, whatever icons the app uses (checkbox tick, chip close...).
// Material Symbols paths on a 24x24 grid.
const PATHS = {
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  dash: 'M19 13H5v-2h14v2z',
  arrowDropDown: 'M7 10l5 5 5-5z',
  arrowDropUp: 'M7 14l5-5 5 5z',
};

export type GlyphName = keyof typeof PATHS;

export const Glyph: FC<{ name: GlyphName; size: number; color: string }> = ({ name, size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Path d={PATHS[name]} fill={color} />
  </Svg>
);

// A built-in mark, or the app's own icon in its place when `source` is given
export const GlyphIcon: FC<{ name: GlyphName; source?: IconSource; size: number; color: string }> = ({ name, source, size, color }) => (
  source !== undefined ? <Icon source={source} size={size} color={color} /> : <Glyph name={name} size={size} color={color} />
);
