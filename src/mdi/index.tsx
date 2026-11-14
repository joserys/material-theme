/**
 * @fileoverview Optional: Material Design Icons (Pictogrammers) as the icon fallback.
 * Needs @react-native-vector-icons/material-design-icons installed in the app.
 *
 * @examples
 * import { materialDesignIcons } from '@helloworldstudio/material-theme/mdi';
 * <IconProvider fallback={materialDesignIcons}>…</IconProvider>
 * <Button icon="trophy-variant">Leaderboards</Button>
 */

import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { IconFallback } from '../icons/IconProvider';

type MdiName = Parameters<typeof MaterialDesignIcons>[0]['name'];

export const materialDesignIcons: IconFallback = (name, { size, color }) => (
  <MaterialDesignIcons
    name={name as MdiName}
    size={size}
    color={color}
    allowFontScaling={false}
    style={{ lineHeight: size }}
  />
);
