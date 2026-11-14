import { ReactNode } from 'react';
import { Text as NativeText, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  FAB, AvatarText, Button, Dialog, Divider, Icon, IconButton, IconProvider, ScreenLayout,
  SplitButtons, Surface, Switch, Text, ThemeProvider, useTheme,
} from '@helloworldstudio/material-theme';
import { materialDesignIcons } from '@helloworldstudio/material-theme/mdi';

const SEED = { hue: 270, chroma: 100, tone: 60, variant: 'vibrant' as const, specVersion: '2025' as const };
const icons = { star: jest.fn(({ size, color }) => <View testID={`star-${size}-${color}`} />) };

const Wrap = ({ children, reducedMotion = false }: { children: ReactNode; reducedMotion?: boolean }) => (
  <ThemeProvider colors={SEED} reducedMotion={reducedMotion} fontScaleCaps={CAPS}>
    <IconProvider icons={icons} fallback={materialDesignIcons}>{children}</IconProvider>
  </ThemeProvider>
);
const CAPS = { display: 1.3 };

beforeEach(() => jest.clearAllMocks());

describe('icons', () => {
  it('draws a registered name with the size and color asked for', () => {
    render(<Wrap><Icon source="star" size={32} color="#ff0000" /></Wrap>);
    expect(screen.getByTestId('star-32-#ff0000', { includeHiddenElements: true })).toBeTruthy();
  });

  it('draws a render function and a ready element', () => {
    render(<Wrap>
      <Icon source={({ size }) => <View testID={`fn-${size}`} />} size={20} />
      <Icon source={<View testID="element" />} />
    </Wrap>);
    expect(screen.getByTestId('fn-20', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('element', { includeHiddenElements: true })).toBeTruthy();
  });

  it('hands unknown names to the fallback, and warns once when nothing knows a name', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ThemeProvider colors={SEED}><IconProvider><Icon source="nope" /><Icon source="nope" /></IconProvider></ThemeProvider>);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
    expect(() => render(<Wrap><Icon source="trophy-variant" /></Wrap>)).not.toThrow();
  });

  it('defaults the color to onSurface', () => {
    let onSurface = '';
    const Probe = () => { onSurface = useTheme().colors.onSurface; return <Icon source="star" />; };
    render(<Wrap><Probe /></Wrap>);
    expect(screen.getByTestId(`star-24-${onSurface}`, { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('text', () => {
  it('uses the role font and the group font cap', () => {
    render(<Wrap><Text variant="displayLarge">Big</Text><Text variant="bodyMedium">Small</Text></Wrap>);
    expect(screen.getByText('Big').props.maxFontSizeMultiplier).toBe(1.3);
    expect(screen.getByText('Small').props.maxFontSizeMultiplier).toBeUndefined();
    expect(screen.getByText('Big')).toHaveStyle({ fontSize: 57 });
  });
});

describe('controls', () => {
  it('Button presses, shows its icon, and stops when disabled', () => {
    const onPress = jest.fn();
    const { rerender } = render(<Wrap><Button icon="star" mode="contained" onPress={onPress}>Go</Button></Wrap>);
    fireEvent.press(screen.getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(icons.star).toHaveBeenCalled();
    rerender(<Wrap><Button disabled onPress={onPress}>Go</Button></Wrap>);
    fireEvent.press(screen.getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('IconButton and FAB press with an accessibility label', () => {
    const onPress = jest.fn();
    render(<Wrap reducedMotion>
      <IconButton icon="star" accessibilityLabel="Favourite" onPress={onPress} />
      <FAB icon="star" label="Settings" onPress={onPress} />
    </Wrap>);
    fireEvent.press(screen.getByLabelText('Favourite'));
    fireEvent.press(screen.getByLabelText('Settings'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('Switch flips its value', () => {
    const onValueChange = jest.fn();
    render(<Wrap><Switch value={false} accessibilityLabel="Haptics" onValueChange={onValueChange} /></Wrap>);
    fireEvent.press(screen.getByLabelText('Haptics'));
    expect(onValueChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch')).toBeTruthy();
  });

  it('SplitButtons selects, but not a disabled button', () => {
    const onValueChange = jest.fn();
    render(<Wrap><SplitButtons value="a" onValueChange={onValueChange} buttons={[
      { value: 'a', label: 'Light', icon: 'star' },
      { value: 'b', label: 'Dark' },
      { value: 'c', label: 'Off', disabled: true },
    ]} /></Wrap>);
    fireEvent.press(screen.getByLabelText('Dark'));
    fireEvent.press(screen.getByLabelText('Off'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });
});

describe('layout', () => {
  it('renders surfaces, dividers, avatars and screens', () => {
    expect(() => render(<Wrap>
      <ScreenLayout scrollingActive><Surface level={3}><NativeText>Inside</NativeText></Surface></ScreenLayout>
      <Divider bold />
      <AvatarText label="HW" />
    </Wrap>)).not.toThrow();
    expect(screen.getByText('Inside')).toBeTruthy();
    expect(screen.getByText('HW', { includeHiddenElements: true })).toBeTruthy();
  });

});

describe('Dialog', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows its content and runs an action once it has closed', () => {
    const start = jest.fn();
    render(<Wrap reducedMotion>
      <Dialog visible title="Game Over" subTitle="Score: 12" icon="star" emphasizeSubTitle actions={[
        { label: 'Play Again', icon: 'star', emphasized: true, onPress: start },
        { label: 'Menu', mode: 'contained-tonal', onPress: jest.fn() },
      ]}>
        <NativeText>Body</NativeText>
      </Dialog>
    </Wrap>);
    act(() => { jest.runAllTimers(); });
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.getByText('Score: 12')).toHaveStyle({ fontSize: 22 });
    fireEvent.press(screen.getByText('Play Again'));
    act(() => { jest.runAllTimers(); });
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('renders nothing while hidden', () => {
    render(<Wrap><Dialog visible={false} title="Hidden" /></Wrap>);
    expect(screen.queryByText('Hidden')).toBeNull();
  });
});
