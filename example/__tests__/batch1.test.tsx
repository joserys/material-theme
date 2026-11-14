import { ReactNode } from 'react';
import { AccessibilityInfo, Text as NativeText, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  Badge, Card, Checkbox, Chip, CircularProgress, IconProvider, LinearProgress, ListItem, LoadingIndicator, Menu,
  NavigationBar, NavigationRail, RadioButton, Slider, Snackbar, TextField, ThemeProvider, Tooltip, TopAppBar,
} from '@helloworldstudio/material-theme';

const icons = { star: () => <View /> };
const Wrap = ({ children }: { children: ReactNode }) => (
  <ThemeProvider reducedMotion mode="light">
    <IconProvider icons={icons}>{children}</IconProvider>
  </ThemeProvider>
);
// Renders, then lets ThemeProvider's first frame pass (it marks the theme ready)
const show = (ui: ReactNode) => {
  const result = render(<Wrap>{ui}</Wrap>);
  act(() => { jest.runOnlyPendingTimers(); });
  return result;
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

describe('Card, Badge, ListItem, TopAppBar', () => {
  it('Card is one button when pressable', () => {
    const onPress = jest.fn();
    show(<Card mode="outlined" onPress={onPress} accessibilityLabel="Level 1"><NativeText>Inside</NativeText></Card>);
    fireEvent.press(screen.getByLabelText('Level 1'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Inside')).toBeTruthy();
  });

  it('Badge caps big numbers', () => {
    show(<><Badge value={1500} /><Badge value={7} /></>);
    expect(screen.getByText('999+')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('ListItem reads all its text as one button', () => {
    const onPress = jest.fn();
    show(<ListItem headline="Sound" supportingText="On" leadingIcon="star" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Sound, On'));
    expect(onPress).toHaveBeenCalled();
  });

  it('TopAppBar has a header title and labelled buttons', () => {
    const back = jest.fn();
    const search = jest.fn();
    show(<TopAppBar title="Settings" subtitle="Display" variant="medium" navigation={{ icon: 'star', onPress: back, accessibilityLabel: 'Back' }} actions={[{ icon: 'star', onPress: search, accessibilityLabel: 'Search' }]} />);
    expect(screen.getByRole('header')).toHaveTextContent('Settings');
    fireEvent.press(screen.getByLabelText('Back'));
    fireEvent.press(screen.getByLabelText('Search'));
    expect(back).toHaveBeenCalled();
    expect(search).toHaveBeenCalled();
  });
});

describe('selection controls', () => {
  it('Checkbox toggles, and indeterminate becomes checked', () => {
    const onValueChange = jest.fn();
    const { rerender } = show(<Checkbox value={false} onValueChange={onValueChange} accessibilityLabel="Agree" />);
    fireEvent.press(screen.getByLabelText('Agree'));
    expect(onValueChange).toHaveBeenLastCalledWith(true);
    rerender(<Wrap><Checkbox value="indeterminate" onValueChange={onValueChange} accessibilityLabel="Agree" /></Wrap>);
    expect(screen.getByRole('checkbox')).toBePartiallyChecked();
    fireEvent.press(screen.getByLabelText('Agree'));
    expect(onValueChange).toHaveBeenLastCalledWith(true);
  });

  it('RadioButton reports selection', () => {
    const onPress = jest.fn();
    show(<RadioButton selected onPress={onPress} accessibilityLabel="Easy" />);
    expect(screen.getByRole('radio')).toBeChecked();
    fireEvent.press(screen.getByLabelText('Easy'));
    expect(onPress).toHaveBeenCalled();
  });

  it('Chip removes without pressing the chip', () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    show(<Chip mode="input" label="Rubik" onPress={onPress} onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Remove Rubik'));
    expect(onClose).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('filter Chip is a toggle with its selected state', () => {
    show(<Chip mode="filter" label="Hard" selected onPress={() => {}} />);
    expect(screen.getByRole('togglebutton')).toBeSelected();
  });

  it('Slider steps for screen readers, within its range', () => {
    const onValueChange = jest.fn();
    show(<Slider value={0.95} step={0.1} onValueChange={onValueChange} accessibilityLabel="Volume" />);
    const slider = screen.getByLabelText('Volume');
    expect(slider.props.accessibilityValue).toMatchObject({ min: 0, max: 1, now: 0.95 });
    fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onValueChange).toHaveBeenLastCalledWith(0.85);
  });
});

describe('TextField', () => {
  it('types, and shows the error text instead of the helper', () => {
    const onChangeText = jest.fn();
    const { rerender } = show(<TextField label="Name" supportingText="Shown on the leaderboard" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText('Name'), 'Jo');
    expect(onChangeText).toHaveBeenCalledWith('Jo');
    expect(screen.getByText('Shown on the leaderboard')).toBeTruthy();
    rerender(<Wrap><TextField label="Name" mode="outlined" supportingText="Shown on the leaderboard" error errorText="Too short" /></Wrap>);
    expect(screen.getByText('Too short')).toBeTruthy();
    expect(screen.queryByText('Shown on the leaderboard')).toBeNull();
  });
});

describe('navigation', () => {
  const destinations = [
    { key: 'play', label: 'Play', icon: 'star' },
    { key: 'scores', label: 'Scores', icon: 'star', badge: 3 },
  ];

  it('NavigationBar selects destinations and reads badges', () => {
    const onValueChange = jest.fn();
    show(<NavigationBar destinations={destinations} value="play" onValueChange={onValueChange} />);
    expect(screen.getByLabelText('Play')).toBeSelected();
    fireEvent.press(screen.getByLabelText('Scores, 3 new'));
    expect(onValueChange).toHaveBeenCalledWith('scores');
  });

  it('NavigationRail shows its header', () => {
    show(<NavigationRail destinations={destinations} value="scores" onValueChange={() => {}} header={<NativeText>Menu</NativeText>} />);
    expect(screen.getByText('Menu')).toBeTruthy();
    expect(screen.getByLabelText('Scores, 3 new')).toBeSelected();
  });
});

describe('Menu, Snackbar, Tooltip', () => {
  it('Menu closes, then runs the item', () => {
    const onDismiss = jest.fn();
    const rename = jest.fn();
    show(<Menu visible onDismiss={onDismiss} anchor={<NativeText>More</NativeText>} items={[{ label: 'Rename', onPress: rename }, 'divider', { label: 'Delete', onPress: jest.fn(), disabled: true }]} />);
    fireEvent.press(screen.getByLabelText('Rename'));
    expect(onDismiss).toHaveBeenCalled();
    expect(rename).toHaveBeenCalled();
  });

  it('Snackbar announces itself and hides after its time', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(false);
    const onDismiss = jest.fn();
    show(<Snackbar visible message="Saved" onDismiss={onDismiss} duration={3000} />);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Saved');
    await act(async () => { await Promise.resolve(); });
    act(() => { jest.advanceTimersByTime(3000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('Snackbar with an action waits for screen reader users', async () => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
    const onDismiss = jest.fn();
    const undo = jest.fn();
    show(<Snackbar visible message="Deleted" onDismiss={onDismiss} action={{ label: 'Undo', onPress: undo }} />);
    await act(async () => { await Promise.resolve(); });
    act(() => { jest.advanceTimersByTime(20000); });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Undo'));
    expect(undo).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('Tooltip shows while held and leaves the element pressable', () => {
    const onPress = jest.fn();
    show(<Tooltip title="Favourite"><NativeText onPress={onPress}>Star</NativeText></Tooltip>);
    const target = screen.getByText('Star');
    fireEvent(target, 'touchStart');
    expect(screen.queryByText('Favourite')).toBeNull();
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByText('Favourite')).toBeTruthy();
    fireEvent.press(target);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('progress and loading', () => {
  it('reports determinate progress, and busy while indeterminate', () => {
    show(<>
      <LinearProgress value={0.5} accessibilityLabel="Download" />
      <LinearProgress wavy accessibilityLabel="Sync" />
      <CircularProgress value={0.25} wavy accessibilityLabel="Upload" />
      <CircularProgress accessibilityLabel="Waiting" />
      <LoadingIndicator contained />
    </>);
    expect(screen.getByLabelText('Download').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
    expect(screen.getByLabelText('Upload').props.accessibilityValue).toEqual({ min: 0, max: 100, now: 25 });
    expect(screen.getByLabelText('Sync')).toBeBusy();
    expect(screen.getByLabelText('Loading')).toBeBusy();
  });
});
