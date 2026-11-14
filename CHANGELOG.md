# Changelog

Version numbers say how safe an update is: `0.1.0 → 0.1.1` is a fix, `→ 0.2.0` adds features, and
`→ 1.0.0` or any `0.x` minor step can change how existing code works. Read the entry before updating.

## 0.4.0 — 2026-11-13

New components and one breaking change: `AnimatedFAB` is gone, use `FAB` (same props).

- `FAB` is one component in three forms: plain, extended (`extended` shows the label and collapses back with
  `extended={false}`, animating the width) and menu (`actions`, `open`, `onOpenChange`: a stack of labelled
  actions over a scrim, with the close button where the FAB was). `ExtendedFAB` and `FABMenu` are the same
  component with the form preset. A FAB with no entrance animation can be pressed at once (it used to wait
  about 400ms).
- `ButtonGroup`: the connected button group, now with `multiSelect` (`value` is then an array). `SplitButtons`
  is kept as another name for it.
- `Portal`, and a portal host inside `ThemeProvider`, to draw overlays above the navigator. `BottomSheet`:
  the M3 modal bottom sheet (drag handle, scrim, back button, keyboard).
- `TextField`: `multiline` with `minHeight`, `maxHeight` and `autoGrow`; `prefixText` and `suffixText`; and
  `onPress` and `active`, which make the field a button.
- `Select` (a `TextField` that opens a `Menu` as wide as the field), `RadioGroup` and `AvatarImage`.
- Built-in marks can be replaced with the app's own icons: `checkIcon` and `indeterminateIcon` on `Checkbox`,
  `checkIcon` and `closeIcon` on `Chip`, `closeIcon` on `Snackbar`, `expandIcon` and `collapseIcon` on `Select`.

## 0.3.2 — 2026-11-06

- Fix: elevation shadows were missing on web and desktop (React Native Web), so FABs, menus, dialogs and
  raised cards had no shadow there. Every platform except Android now uses the boxShadow levels; Android
  keeps `elevation`. No API changes.

## 0.3.1 — 2026-11-06

- License: now open source under the MIT License, copyright Hello World Studio LLC (was proprietary).
  No code changes.

## 0.3.0 — 2026-11-05

New components (M3 Expressive). Apps now also need `react-native-svg` installed.

- Card (elevated, filled, outlined), Badge, ListItem (one to three lines, selected state).
- TopAppBar: small, center-aligned, medium flexible and large flexible, with subtitle, navigation and actions.
- NavigationBar and NavigationRail, with active indicators, filled icons when selected, and badges.
- Checkbox (with indeterminate and error), RadioButton, Chip (assist, filter, input, suggestion), Slider
  (Expressive handle and track, value label, screen reader steps), TextField (filled and outlined, floating label).
- Menu (anchored, kept on screen), Snackbar (announced; waits for screen reader users when it has an
  action), Tooltip (plain).
- LinearProgress and CircularProgress, determinate or indeterminate, with the Expressive `wavy` style, and
  the Expressive LoadingIndicator (morphing shapes, optional container).

## 0.2.0 — 2026-11-05

Breaking changes. Update each app's code when it moves to this version.

- Removed the Swipe Rush pieces: `GradientBackground` (`/gradient`, and the Skia dependency), `Header`,
  `SettingWidget` and `ExtendedSurface`. Apps that use them keep their own copies.
- Removed `createSettings`. The package no longer saves anything; apps save their own settings, or keep
  constants, and pass the values to `ThemeProvider`.
- Every theme setting has a default, so `<ThemeProvider>` works with no props:
  - colors: the M3 baseline seed, in HCT: hue 299, chroma 48, tone 40. The defaults changed to
    `variant: 'tonalSpot'` (was `fidelity`) and `specVersion: '2025'` (was `2021`). Apps that set these
    themselves look the same.
  - `mode` and `reducedMotion` take `'system'` (the new default) to follow the phone's settings.
- New: `onReady` and `loading` on `ThemeProvider`, and `useThemeReady()`, for keeping the bootsplash up
  until the theme is set up and the app's own loading is done.
- `Dialog` keeps its look and props; it no longer uses the removed components inside.

## 0.1.1 — 2026-11-04

- Fix: `@helloworldstudio/material-theme/gradient` couldn't be imported (the entry pointed at a file
  that doesn't exist). Found by the example app's tests.
- Fix: a color option passed as `undefined` (e.g. `colorBlindMode` left out of `ThemeProvider`'s
  `colors`) crashed the theme. It now uses the default.
- The example app (`example/`, not part of the package) installs the packed release and tests it.

## 0.1.0 — 2026-11-04

First version, taken from Swipe Rush - Arcade.

- Theme: `ThemeProvider`, `useTheme`, `createMaterialTheme`. Material 3 Expressive colors from a seed
  (`generateDynamicColors`: scheme variants, contrast, the 2025 spec, color-blind modes), the type scale
  with emphasized weights, spacing, shape, motion, elevation, state layers, and a `navigation` theme.
- Fonts: any font per type scale group or role (`fonts`), and optional text size caps per group
  (`fontScaleCaps`). No fonts are built in; anything left out uses the system font.
- Reduce Motion: the app's own setting, passed to `ThemeProvider` as `reducedMotion`.
- Icons: `IconProvider` and `Icon`. Every component takes an icon name, a render function or an element.
  Material Design Icons is optional (`/mdi`).
- Settings: `createSettings` for an app's own typed settings, saved to any storage (e.g. AsyncStorage).
- Components: Text, Button, IconButton, AnimatedFAB, Switch, SplitButtons, Divider, AvatarText,
  TouchableRipple, Header, Surface, ExtendedSurface, AnimatedView, ScreenLayout, SettingWidget, Dialog.
- Optional: `GradientBackground` (`/gradient`, needs Skia).
