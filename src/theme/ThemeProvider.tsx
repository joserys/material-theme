import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { createMaterialTheme } from './createMaterialTheme';
import { PortalHost } from '../components/portal';
import type { AppTheme, OrSystem, ThemeMode, ThemeOptions } from './types';

const ThemeState = createContext<AppTheme | undefined>(undefined);
const ReadyState = createContext(false);

export interface ThemeProviderProps extends Omit<ThemeOptions, 'mode' | 'reducedMotion'> {
  /** 'light', 'dark', or 'system' (default) to follow the phone */
  mode?: OrSystem<ThemeMode>;
  /** The app's own Reduce Motion setting, or 'system' (default) to follow the phone's */
  reducedMotion?: OrSystem<boolean>;
  /** True while the app is still loading what it needs (e.g. its saved settings or images); holds back onReady */
  loading?: boolean;
  /** Runs once, after the themed app has drawn its first frame and nothing is loading, e.g. to hide the bootsplash */
  onReady?: () => void;
  children: ReactNode;
}

// The phone's Reduce Motion setting; undefined until it has been read
const useSystemReducedMotion = (enabled: boolean) => {
  const [reduced, setReduced] = useState<boolean>();
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(on => { if (!cancelled) setReduced(on); })
      .catch(() => { if (!cancelled) setReduced(false); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [enabled]);
  return reduced;
};

// Builds the app theme with createMaterialTheme and shares it with every component (read it with useTheme).
// Every option has a default, so <ThemeProvider> alone gives the M3 baseline theme, following the phone's
// light/dark and Reduce Motion settings. The app passes its own values to override any of them: constants,
// or values it saves itself and loads (keep `loading` true until they have loaded).
// Rebuilt only when an option value changes, so an inline `colors` object is fine; keep `fonts` and
// `fontScaleCaps` stable (define them outside the component).
export const ThemeProvider: FC<ThemeProviderProps> = ({
  mode = 'system',
  colors = {},
  fonts,
  fontScaleCaps,
  reducedMotion = 'system',
  loading = false,
  onReady,
  children,
}) => {
  const systemScheme = useColorScheme();
  const systemReducedMotion = useSystemReducedMotion(reducedMotion === 'system');
  const resolvedMode: ThemeMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const resolvedReducedMotion = reducedMotion === 'system' ? systemReducedMotion ?? false : reducedMotion;

  const { hue, chroma, tone, variant, contrast, specVersion, colorBlindMode } = colors;
  const theme = useMemo(
    () => createMaterialTheme({
      mode: resolvedMode,
      colors: { hue, chroma, tone, variant, contrast, specVersion, colorBlindMode },
      fonts,
      fontScaleCaps,
      reducedMotion: resolvedReducedMotion,
    }),
    [resolvedMode, hue, chroma, tone, variant, contrast, specVersion, colorBlindMode, fonts, fontScaleCaps, resolvedReducedMotion],
  );

  // Ready once nothing is loading and the phone's Reduce Motion is known, after the next frame is drawn
  const [ready, setReady] = useState(false);
  const settled = !loading && (reducedMotion !== 'system' || systemReducedMotion !== undefined);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  useEffect(() => {
    if (ready || !settled) return;
    const frame = requestAnimationFrame(() => {
      setReady(true);
      onReadyRef.current?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, settled]);

  return (
    <ThemeState.Provider value={theme}>
      <ReadyState.Provider value={ready}><PortalHost>{children}</PortalHost></ReadyState.Provider>
    </ThemeState.Provider>
  );
};

// The current theme (colors, fonts, spacing, shape, motion, elevation, state layers, reducedMotion).
// Must be used inside ThemeProvider.
export const useTheme = (): AppTheme => {
  const theme = useContext(ThemeState);
  if (theme === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return theme;
};

// True once ThemeProvider's onReady has run: the theme is set up and drawn, and nothing is loading.
// Stays true after that, even if `loading` turns on again.
export const useThemeReady = (): boolean => useContext(ReadyState);
