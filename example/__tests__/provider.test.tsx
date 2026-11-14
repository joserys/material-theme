import { AccessibilityInfo, Text, useColorScheme } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { ThemeProvider, useTheme, useThemeReady } from '@helloworldstudio/material-theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: jest.fn(() => 'light') }));
const colorScheme = useColorScheme as jest.Mock;

let reduceMotionListener: ((on: boolean) => void) | undefined;
beforeEach(() => {
  jest.useFakeTimers();
  colorScheme.mockReturnValue('light');
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, listener) => {
    reduceMotionListener = listener as (on: boolean) => void;
    return { remove: jest.fn() } as any;
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const Probe = () => {
  const { dark, reducedMotion } = useTheme();
  const ready = useThemeReady();
  return <Text>{`${dark ? 'dark' : 'light'} ${reducedMotion ? 'still' : 'moving'} ${ready ? 'ready' : 'waiting'}`}</Text>;
};

// Lets the Reduce Motion check resolve and the first frame pass
const settle = async () => {
  await act(async () => { await Promise.resolve(); });
  act(() => { jest.runAllTimers(); });
};

describe('ThemeProvider defaults', () => {
  it('works with no options, following the phone', async () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    await settle();
    expect(screen.getByText('light moving ready')).toBeTruthy();
  });

  it("follows the phone's dark mode and Reduce Motion as they change", async () => {
    colorScheme.mockReturnValue('dark');
    const { rerender } = render(<ThemeProvider><Probe /></ThemeProvider>);
    await settle();
    expect(screen.getByText('dark moving ready')).toBeTruthy();
    colorScheme.mockReturnValue('light');
    act(() => reduceMotionListener?.(true));
    rerender(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByText('light still ready')).toBeTruthy();
  });

  it("uses the app's own values over the phone's", async () => {
    colorScheme.mockReturnValue('light');
    render(<ThemeProvider mode="dark" reducedMotion><Probe /></ThemeProvider>);
    await settle();
    expect(screen.getByText('dark still ready')).toBeTruthy();
  });
});

describe('ready signal', () => {
  it('runs onReady once, after loading ends', async () => {
    const onReady = jest.fn();
    const { rerender } = render(<ThemeProvider loading onReady={onReady}><Probe /></ThemeProvider>);
    await settle();
    expect(onReady).not.toHaveBeenCalled();
    expect(screen.getByText('light moving waiting')).toBeTruthy();

    rerender(<ThemeProvider loading={false} onReady={onReady}><Probe /></ThemeProvider>);
    await settle();
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.getByText('light moving ready')).toBeTruthy();

    rerender(<ThemeProvider loading onReady={onReady}><Probe /></ThemeProvider>);
    rerender(<ThemeProvider loading={false} onReady={onReady}><Probe /></ThemeProvider>);
    await settle();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("waits for the phone's Reduce Motion setting when following it", async () => {
    let answer!: (on: boolean) => void;
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockReturnValue(new Promise(resolve => { answer = resolve; }));
    const onReady = jest.fn();
    render(<ThemeProvider onReady={onReady}><Probe /></ThemeProvider>);
    await settle();
    expect(onReady).not.toHaveBeenCalled();
    await act(async () => answer(true));
    await settle();
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(screen.getByText('light still ready')).toBeTruthy();
  });
});
