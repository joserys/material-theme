/**
 * withOpacity
 * Returns a theme color (hex, e.g. '#3a5f8a') at the given opacity as an rgba() string.
 * Used for M3 state layers and disabled states, e.g. withOpacity(colors.onSurface, theme.state.pressed).
 */
export const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
