import { FC } from 'react';
import { FABBase, FABBaseProps } from './fabBase';
import { MenuFAB, FABMenuProps } from './fabMenu';

export type { FABVariant } from './fabBase';
export type { FABMenuAction, FABMenuProps } from './fabMenu';

/** A FAB that does one thing when pressed (plain, or extended with a visible label) */
export type FABActionProps = FABBaseProps & { actions?: undefined };

/** A FAB that opens a menu of actions instead of doing one thing (see FABMenu) */
export type FABProps = FABActionProps | FABMenuProps;

// M3 Expressive floating action button, in the three forms it comes in:
// - plain: an icon-only square (`icon`, `label` for screen readers, `onPress`);
// - extended: give `extended` and the label shows next to the icon; `extended={false}` collapses it back to
//   the square, animating the width (collapse it when the screen scrolls down, say);
// - menu: give `actions`, `open` and `onOpenChange` and it opens a stack of labelled actions over a scrim.
// It can also slide/fade in from an edge when `visible` changes (`animationDirection`).
// ExtendedFAB and FABMenu are the same component with the matching form preset.
export const FAB: FC<FABProps> = props => (props.actions !== undefined ? <MenuFAB {...props} /> : <FABBase {...props} />);

/** FAB that shows its label (extended unless `extended={false}`) */
export const ExtendedFAB: FC<FABActionProps> = ({ extended = true, ...props }) => <FAB extended={extended} {...props} />;

/** FAB that opens a menu of actions */
export const FABMenu: FC<FABMenuProps> = props => <FAB {...props} />;
