import { FC, ReactNode, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconSource } from '../icons/IconProvider';
import { Button, ButtonMode } from './button';
import { Divider } from './divider';
import { Surface } from './surface';
import { Text } from './text';

export interface DialogAction {
  label: string;
  onPress: () => void;
  icon?: IconSource;
  mode?: ButtonMode;    // default 'contained'
  emphasized?: boolean; // the dialog's main action
  disabled?: boolean;
}

interface DialogProps {
  visible: boolean;
  title: string;
  subTitle?: string;
  icon?: IconSource;
  emphasizeSubTitle?: boolean; // titleLargeEmphasized subtitle, for the moment that matters (e.g. a score)
  actions?: DialogAction[];    // stacked full-width buttons, in order
  children?: ReactNode;
}

// M3 dialog over a dimmed backdrop: icon and title, content, then stacked actions. Slides up when `visible`.
// Buttons stay disabled until it has finished sliding in, and an action runs once it has slid out.
// Render it above the screen's content (it fills its parent).
export const Dialog: FC<DialogProps> = ({ visible, title, subTitle, icon, emphasizeSubTitle = false, actions = [], children }) => {
  const { colors, motion, spacing, size, reducedMotion } = useTheme();
  const { top, bottom, left, right } = useSafeAreaInsets();
  const [shown, setShown] = useState(false);
  const [ready, setReady] = useState(false);
  const opacity = useSharedValue(0);
  const offset = useSharedValue(spacing.xxlarge); // slides up from this far below

  // Fades and springs in when shown, fades and drops out when not; jumps with Reduce Motion
  useEffect(() => {
    if (reducedMotion) {
      opacity.value = shown ? 1 : 0;
      offset.value = 0;
      setReady(shown);
      return;
    }
    if (shown) {
      opacity.value = withTiming(1, { duration: motion.duration.long2, easing: motion.easing.emphasizedDecelerate },
        finished => { if (finished) scheduleOnRN(setReady, true); });
      offset.value = withSpring(0, motion.spring.slowSpatial);
    } else {
      opacity.value = withTiming(0, { duration: motion.duration.medium1, easing: motion.easing.emphasizedAccelerate });
      offset.value = withTiming(spacing.xxlarge, { duration: motion.duration.medium2, easing: motion.easing.emphasizedAccelerate });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- animate only when shown or the motion setting changes
  }, [shown, reducedMotion]);

  const surfaceStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: offset.value }] }));

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }
    // Let the screen behind settle first, as screens change after medium2
    const timer = setTimeout(() => setShown(true), reducedMotion ? 0 : motion.duration.medium2);
    return () => clearTimeout(timer);
  }, [visible, reducedMotion, motion.duration.medium2]);

  const press = (action: DialogAction) => {
    setShown(false);
    setReady(false);
    setTimeout(action.onPress, reducedMotion ? 0 : motion.duration.medium2);
  };

  if (!visible && !shown) return null;

  return (
    <View
      style={{
        backgroundColor: colors.backdrop,
        position: 'absolute', zIndex: 2, top: 0, bottom: 0, right: 0, left: 0,
        paddingTop: top + spacing.xlarge, paddingBottom: bottom + spacing.xlarge,
        paddingRight: right + spacing.xlarge, paddingLeft: left + spacing.xlarge,
      }}
    >
      <Surface level={3} style={surfaceStyle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {icon !== undefined && <Icon source={icon} size={size.icon.large} />}
          <View style={{ flex: 1, marginLeft: icon !== undefined ? spacing.large : 0 }}>
            <Text variant="labelSmall">{title}</Text>
            {subTitle !== undefined && <Text variant={emphasizeSubTitle ? 'titleLargeEmphasized' : 'titleLarge'}>{subTitle}</Text>}
          </View>
        </View>
        <Divider bold style={{ marginVertical: spacing.largeIncreased }} />
        {children}
        {actions.length > 0 && <Divider bold style={{ marginVertical: spacing.largeIncreased }} />}
        {actions.map((action, index) => (
          <Button
            key={action.label}
            mode={action.mode ?? 'contained'}
            icon={action.icon}
            emphasized={action.emphasized}
            disabled={!ready || action.disabled}
            style={{ marginBottom: index < actions.length - 1 ? spacing.large : 0 }}
            onPress={() => press(action)}
          >
            {action.label}
          </Button>
        ))}
      </Surface>
    </View>
  );
};
