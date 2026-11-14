// Example app: every part of @helloworldstudio/material-theme on one screen. Used to check the package
// bundles, and as a starting point for a new app.
// The package saves nothing. This app saves its theme choices itself (useSavedThemeSettings, with
// AsyncStorage) and holds ThemeProvider's onReady back until they've loaded; any app could keep constants instead.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  FAB, Badge, Button, Card, Checkbox, Chip, CircularProgress, Dialog, Divider, IconButton, IconProvider,
  LinearProgress, ListItem, LoadingIndicator, Menu, NavigationBar, RadioButton, ScreenLayout, Slider, Snackbar,
  SplitButtons, Surface, Switch, Text, TextField, ThemeProvider, Tooltip, TopAppBar, useTheme,
  type FontOverrides, type IconRender, type OrSystem, type ThemeMode,
} from '@helloworldstudio/material-theme';
import { materialDesignIcons } from '@helloworldstudio/material-theme/mdi';

// The theme choices this app lets people change; everything else stays at its default
interface ThemeChoices {
  mode: OrSystem<ThemeMode>;
  reducedMotion: OrSystem<boolean>;
}
const DEFAULT_CHOICES: ThemeChoices = { mode: 'system', reducedMotion: 'system' };
const STORAGE_KEY = 'example-theme';

// Loads the saved choices at launch and saves every change
const useSavedThemeSettings = () => {
  const [choices, setChoices] = useState(DEFAULT_CHOICES);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => { if (saved) setChoices({ ...DEFAULT_CHOICES, ...JSON.parse(saved) }); })
      .catch(error => console.warn('Could not load the theme settings', error))
      .finally(() => setLoading(false));
  }, []);
  const update = useCallback((changes: Partial<ThemeChoices>) => setChoices(current => {
    const next = { ...current, ...changes };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(error => console.warn('Could not save the theme settings', error));
    return next;
  }), []);
  return { choices, update, loading };
};

// System font everywhere except display and headline (swap in the app's own font files' PostScript names)
const fonts: FontOverrides = {};
const fontScaleCaps = { display: 1.3, headline: 1.3 };

// A custom icon drawn in SVG; every other name comes from Material Design Icons
const dot: IconRender = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="8" fill={color} /></Svg>
);
const icons = { dot };

type SavedThemeSettings = ReturnType<typeof useSavedThemeSettings>;

const Screen = ({ choices, update }: Pick<SavedThemeSettings, 'choices' | 'update'>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [snackbar, setSnackbar] = useState(false);
  const [tab, setTab] = useState('home');
  const [agree, setAgree] = useState(false);
  const [level, setLevel] = useState('easy');
  const [filters, setFilters] = useState<string[]>(['Arcade']);
  const [volume, setVolume] = useState(0.6);
  const [name, setName] = useState('');
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopAppBar
        title="Template"
        subtitle="Material 3 Expressive"
        variant="medium"
        actions={[{ icon: 'magnify', onPress: () => setSnackbar(true), accessibilityLabel: 'Search' }]}
      />
      <View style={{ flex: 1 }}>
      <ScreenLayout scrollingActive spacingControl={{ paddingTop: 16, paddingBottom: 32 }}>
        <Surface level={1} style={{ marginBottom: 24 }}>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Display</Text>
          <SplitButtons
            value={choices.mode}
            onValueChange={mode => update({ mode: mode as ThemeChoices['mode'] })}
            buttons={[
              { value: 'system', label: 'Auto', icon: 'theme-light-dark' },
              { value: 'light', label: 'Light', icon: 'weather-sunny' },
              { value: 'dark', label: 'Dark', icon: 'weather-night' },
            ]}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <Text variant="labelLarge">Reduce Motion</Text>
            <Switch value={choices.reducedMotion === true} accessibilityLabel="Reduce Motion" onValueChange={on => update({ reducedMotion: on ? true : 'system' })} />
          </View>
        </Surface>
        <Surface level={1}>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Actions</Text>
          <Button mode="contained" icon="play" emphasized onPress={() => setDialogOpen(true)}>Open dialog</Button>
          <Divider style={{ marginVertical: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Tooltip title="Custom icon"><IconButton icon="dot" accessibilityLabel="Custom icon" onPress={() => {}} /></Tooltip>
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={<IconButton icon="dots-vertical" accessibilityLabel="More" onPress={() => setMenuOpen(true)} />}
              items={[
                { label: 'Rename', icon: 'pencil-outline', onPress: () => {} },
                { label: 'Share', icon: 'share-variant-outline', onPress: () => {}, selected: true },
                'divider',
                { label: 'Delete', icon: 'delete-outline', onPress: () => {}, disabled: true },
              ]}
            />
            <Button onPress={() => setSnackbar(true)}>Show snackbar</Button>
          </View>
        </Surface>
        <Card mode="filled" style={{ marginTop: 24 }}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Controls</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox value={agree} onValueChange={setAgree} accessibilityLabel="Agree" />
            <Text>Agree</Text>
            <RadioButton selected={level === 'easy'} onPress={() => setLevel('easy')} accessibilityLabel="Easy" style={{ marginLeft: 16 }} />
            <Text>Easy</Text>
            <RadioButton selected={level === 'hard'} onPress={() => setLevel('hard')} accessibilityLabel="Hard" />
            <Text>Hard</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
            {['Arcade', 'Puzzle', 'Music'].map(filter => (
              <Chip
                key={filter}
                mode="filter"
                label={filter}
                selected={filters.includes(filter)}
                onPress={() => setFilters(current => current.includes(filter) ? current.filter(f => f !== filter) : [...current, filter])}
              />
            ))}
            <Chip mode="assist" icon="calendar" label="Add event" onPress={() => {}} />
            <Chip mode="input" label="Rubik" onClose={() => {}} />
          </View>
          <Slider value={volume} onValueChange={setVolume} formatValue={v => `${Math.round(v * 100)}`} accessibilityLabel="Volume" />
          <TextField label="Player name" value={name} onChangeText={setName} supportingText="Shown on the leaderboard" style={{ marginTop: 16 }} />
          <TextField label="Email" mode="outlined" leadingIcon="email-outline" error={name === 'x'} errorText="Not valid" backgroundColor="transparent" style={{ marginTop: 16 }} />
        </Card>
        <Card mode="outlined" style={{ marginTop: 24 }} contentStyle={{ paddingHorizontal: 0 }}>
          <ListItem headline="Notifications" supportingText="Two new" leadingIcon="bell-outline" trailing={<Badge value={2} />} onPress={() => {}} />
          <ListItem headline="Sound" leadingIcon="volume-high" trailing={<Switch value accessibilityLabel="Sound" />} />
        </Card>
        <Card style={{ marginTop: 24 }}>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Progress</Text>
          <LinearProgress value={volume} accessibilityLabel="Volume level" />
          <LinearProgress wavy value={volume} style={{ marginTop: 16 }} accessibilityLabel="Wavy" />
          <LinearProgress style={{ marginTop: 16 }} accessibilityLabel="Loading" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <CircularProgress value={volume} />
            <CircularProgress value={volume} wavy />
            <CircularProgress />
            <LoadingIndicator />
            <LoadingIndicator contained />
          </View>
        </Card>
      </ScreenLayout>
      </View>
      <NavigationBar
        value={tab}
        onValueChange={setTab}
        destinations={[
          { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
          { key: 'scores', label: 'Scores', icon: 'trophy-outline', activeIcon: 'trophy', badge: 3 },
          { key: 'settings', label: 'Settings', icon: 'cog-outline', activeIcon: 'cog', badge: true },
        ]}
      />
      <Snackbar visible={snackbar} message="Saved" action={{ label: 'Undo', onPress: () => {} }} onDismiss={() => setSnackbar(false)} style={{ bottom: 96 }} />
      <View style={{ position: 'absolute', right: 32, bottom: 120 }}>
        <FAB icon="cog-outline" label="Settings" onPress={() => {}} />
      </View>
      <Dialog
        visible={dialogOpen}
        title="Dialog"
        subTitle="It works"
        icon="dot"
        actions={[
          { label: 'Close', icon: 'check', emphasized: true, onPress: () => setDialogOpen(false) },
          { label: 'Reset settings', mode: 'contained-tonal', onPress: () => setDialogOpen(false) },
        ]}
      >
        <Text>Any content goes here.</Text>
      </Dialog>
    </View>
  );
};

// An app with a bootsplash would hide it here, e.g. BootSplash.hide({ fade: true })
const hideSplash = () => {};

export const App = () => {
  const { choices, update, loading } = useSavedThemeSettings();
  return (
    <SafeAreaProvider>
      <ThemeProvider
        mode={choices.mode}
        reducedMotion={choices.reducedMotion}
        colors={{ hue: 270, chroma: 100, tone: 60, variant: 'vibrant' }} // fixed by the developer
        fonts={fonts}
        fontScaleCaps={fontScaleCaps}
        loading={loading}
        onReady={hideSplash}
      >
        <IconProvider icons={icons} fallback={materialDesignIcons}>
          {!loading && <Screen choices={choices} update={update} />}
        </IconProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
