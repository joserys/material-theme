# @helloworldstudio/material-theme

Hello World Studio's Material 3 Expressive theme system for React Native, taken from Swipe Rush - Arcade.
One package gives an app a generated color scheme, the M3 type scale in its own fonts, motion and shape
tokens, and themed components that take any icon. Every theme setting has a default. The app overrides
what it wants, with constants or with values it saves itself; the package never saves anything.

Open source under the MIT License, copyright Hello World Studio LLC (see [LICENSE](LICENSE)). It isn't
published anywhere yet: `"private": true` in `package.json` stops it being published to the public npm
registry by accident. Remove that line only when it's time to publish.

## What's inside

| Part | What it does |
|---|---|
| `ThemeProvider`, `useTheme` | Builds the theme from a seed color and shares it with every component |
| `onReady`, `useThemeReady` | Says when the theme is set up and drawn, e.g. to hide the bootsplash |
| `generateDynamicColors` | Material's own color engine: scheme variants, contrast, the 2025 spec, color-blind modes |
| Fonts | Any font per type scale group or role; system font for the rest |
| `IconProvider`, `Icon` | The app decides what every icon name draws |
| Components | See the table below |
| `/mdi` (optional) | Material Design Icons as the icon fallback |

## Components

Every component reads the theme, takes any icon, follows Reduce Motion, and has screen reader labels and roles.

| Group | Components |
|---|---|
| Actions | `Button`, `IconButton`, `FAB` (plain, extended with `ExtendedFAB`, menu with `FABMenu`), `ButtonGroup` (pick one or several; `SplitButtons` is its old name), `Chip` (assist, filter, input, suggestion) |
| Containment | `Surface`, `Card` (elevated, filled, outlined), `Dialog`, `BottomSheet`, `Portal`, `Divider`, `ListItem` |
| Navigation | `TopAppBar` (small, center, medium, large), `NavigationBar`, `NavigationRail` |
| Selection and input | `Checkbox`, `RadioButton`, `RadioGroup`, `Switch`, `Slider`, `TextField` (filled, outlined, multiline, prefix and suffix text), `Select` |
| Communication | `Badge`, `Snackbar`, `Tooltip`, `LinearProgress`, `CircularProgress` (both with `wavy`), `LoadingIndicator` |
| Menus | `Menu` |
| Building blocks | `Text`, `Icon`, `TouchableRipple`, `AvatarText`, `AvatarImage`, `AnimatedView`, `ScreenLayout` |

Notes:
- Ticks, dashes, close marks and the `Select` arrow are drawn by the package, so they look right whatever
  icons the app uses. To use your own, pass `checkIcon`, `indeterminateIcon` (`Checkbox`), `checkIcon`,
  `closeIcon` (`Chip`), `closeIcon` (`Snackbar`) or `expandIcon`, `collapseIcon` (`Select`).
- `ThemeProvider` includes a portal host. Anything inside `<Portal>` (and `BottomSheet`, and the open `FABMenu`)
  is drawn above the whole app, including the navigator. It sees the theme, but not React context added
  between `ThemeProvider` and the `Portal`: pass such values in as props.
- `Dialog` takes `children` for custom content; wrap it in `<Portal>` to cover the navigator.
- `Tooltip` shows above its element inside the parent, so the parent needs room above and must not clip it.
- `Snackbar` with an action doesn't hide itself while a screen reader is on, so there's time to reach the action.
- Indeterminate progress keeps moving with Reduce Motion (it's the only sign something is happening), but
  waves hold still and `LoadingIndicator` stops morphing and turns slowly.

## Install (local, no remote repository yet)

Releases are packed into `releases/` as `.tgz` files. An app installs one by path, exactly like a
package from npm, and gets its own copy in `node_modules` (no symlinks, so Metro needs no setup).

1. In this folder, make a release:
   ```bash
   npm run release
   ```
   This type-checks the package and writes `releases/helloworldstudio-material-theme-<version>.tgz`.
2. In the app, install it and the libraries it builds on (the app owns these):
   ```bash
   npm install ../material-theme/releases/helloworldstudio-material-theme-0.4.0.tgz
   npm install react-native-reanimated react-native-worklets react-native-safe-area-context react-native-svg
   ```
   Optional: `@react-native-vector-icons/material-design-icons` for `/mdi`.
3. The app's `babel.config.js` must include Reanimated's plugin, as Reanimated requires anyway.

### Updating an app

1. Change the code here, add an entry to [CHANGELOG.md](CHANGELOG.md), and raise `version` in
   `package.json` (fix: 0.1.0 → 0.1.1, new feature: → 0.2.0, breaking change: → 0.x+1.0 or 1.0.0).
2. `npm run release`.
3. In each app that should update: `npm install ../material-theme/releases/helloworldstudio-material-theme-<new version>.tgz`.
   Apps that aren't updated keep the version they have.

Later, the same package can move to a private registry (GitHub Packages or a private npm org). Apps then
update with `npm update`, and nothing in the code changes.

## Set up an app

The smallest setup is `<ThemeProvider>` with no options: the M3 baseline colors, the system font, and
the phone's own light/dark and Reduce Motion settings.

```tsx
<SafeAreaProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</SafeAreaProvider>
```

### Theme settings and their defaults

Pass any of these to `ThemeProvider` to override the default:

| Prop | Default | Takes |
|---|---|---|
| `mode` | `'system'` (follows the phone) | `'light'`, `'dark'`, `'system'` |
| `colors.hue` / `chroma` / `tone` | `299` / `48` / `40` (M3 baseline seed) | HCT seed: hue 0-360, chroma 0-~120, tone 0-100 |
| `colors.variant` | `'tonalSpot'` (Theme Builder default) | `fidelity`, `tonalSpot`, `neutral`, `vibrant`, `expressive`, `content`, `monochrome`, `rainbow`, `fruitSalad` |
| `colors.specVersion` | `'2025'` (M3 Expressive rules) | `'2021'`, `'2025'` |
| `colors.contrast` | `'standard'` | `'standard'`, `'medium'`, `'high'`, or -1 to 1 |
| `colors.colorBlindMode` | `'none'` | `'none'`, `'protanopia'`, `'deuteranopia'`, `'tritanopia'` |
| `fonts` | system font | font per type scale group or role (see Fonts) |
| `fontScaleCaps` | no caps | largest text size per group |
| `reducedMotion` | `'system'` (follows the phone) | `true`, `false`, `'system'` |
| `loading` | `false` | `true` holds back `onReady` |
| `onReady` | none | runs once when the theme is ready |

`DEFAULT_COLOR_OPTIONS` holds the color defaults. Icons are set separately, with `IconProvider` (see Icons).

### Constants or saved settings: the app decides

The package keeps nothing on the device. For a fixed look, pass constants. To let people change a setting,
the app saves and loads the value with whatever storage it likes and passes it in:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import BootSplash from 'react-native-bootsplash';
import { IconProvider, ThemeProvider, type FontOverrides, type OrSystem, type ThemeMode } from '@helloworldstudio/material-theme';
import { materialDesignIcons } from '@helloworldstudio/material-theme/mdi';

// Fonts: by group, by role, or one file per weight. Names are the fonts' PostScript names.
const fonts: FontOverrides = {
  display: 'MyDisplay-Regular',
  body: { regular: 'MySans-Regular', emphasized: 'MySans-Medium' },
};

// Icons: your own, then Material Design Icons for any other name
const icons = { logo: ({ size, color }) => <Logo width={size} height={size} fill={color} /> };

export const Root = () => {
  // The app's own saving: here, light/dark is editable and stored, everything else is fixed
  const [mode, setMode] = useState<OrSystem<ThemeMode>>('system');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem('myapp-mode')
      .then(saved => { if (saved) setMode(saved as OrSystem<ThemeMode>); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider
        mode={mode}
        colors={{ hue: 270, chroma: 100, tone: 60, variant: 'vibrant' }}
        fonts={fonts}
        fontScaleCaps={{ display: 1.3 }}
        loading={loading}
        onReady={() => BootSplash.hide({ fade: true })}
      >
        <IconProvider icons={icons} fallback={materialDesignIcons}>
          {!loading && <App onModeChange={next => { setMode(next); AsyncStorage.setItem('myapp-mode', next); }} />}
        </IconProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
```

### Ready signal (bootsplash)

- `onReady` runs once, after the themed app has drawn its first frame.
- It waits while `loading` is true, so the app can keep the bootsplash up while it loads its saved
  settings, images or anything else. When following the phone's Reduce Motion, it also waits until that
  setting has been read, so the first screen never animates for someone who turned motion off.
- `useThemeReady()` returns the same thing to any component: false, then true for good.
- Building the theme takes no time and fonts and icons ship inside the app, so any wait is the app's own loading.

Then, anywhere inside:

```tsx
const { colors, spacing } = useTheme();
<Button mode="contained" icon="logo" emphasized onPress={start}>Start</Button>
<Switch value={motionOff} accessibilityLabel="Reduce Motion" onValueChange={setMotionOff} />
```

With React Navigation, pass the theme's `navigation` to it: `<NavigationContainer theme={useTheme().navigation}>`.

### Fonts

- The app adds its font files to its own iOS and Android projects, as React Native requires. The
  package can't ship them.
- `fonts` takes a group (`display`, `headline`, `title`, `body`, `label`) or a role (`titleLarge`). A
  role wins over its group.
- A single name uses the type scale's weights. For static fonts with one file per weight, give
  `{ regular, emphasized }`, so Android never fakes the weight.
- `fontScaleCaps` limits how far each group grows with the phone's text size setting. Wide display fonts
  often need a cap.

### Icons

Every `icon` prop takes:
- a name, looked up in `IconProvider`'s `icons`, then its `fallback`;
- a render function, `({ size, color }) => <MySvg … />`;
- or a ready element, shown as given.

A name nothing knows draws an empty space and warns once in development.

## Working on the template

```bash
npm install
npm run typecheck
```

Shared code reaches every app that updates, so for each release:
- note what changed in the changelog;
- raise the version by the right step;
- try it in at least one app before other apps update.
