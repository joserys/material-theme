import { createContext, FC, Fragment, ReactNode, useContext, useEffect, useId, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface PortalApi {
  set: (key: string, node: ReactNode | null) => void;
}

const PortalContext = createContext<PortalApi | undefined>(undefined);

// Draws everything its children send through <Portal> on top of the whole app, after `children`.
// ThemeProvider already includes one, so apps don't render this themselves.
export const PortalHost: FC<{ children: ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<Map<string, ReactNode>>(() => new Map());
  const api = useMemo<PortalApi>(() => ({
    set: (key, node) => setEntries(previous => {
      const next = new Map(previous);
      if (node === null) next.delete(key);
      else next.set(key, node);
      return next;
    }),
  }), []);

  return (
    <PortalContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
        {[...entries].map(([key, node]) => <Fragment key={key}>{node}</Fragment>)}
      </View>
    </PortalContext.Provider>
  );
};

// Renders its children above the navigator and every screen instead of where it is written, so overlays
// (dialogs, sheets, menus) aren't clipped or covered by screen layout. Later portals draw above earlier ones.
// The children are drawn inside ThemeProvider, so they see the theme, but not React context added between
// ThemeProvider and the Portal (e.g. a screen's own provider): pass such values in as props.
export const Portal: FC<{ children: ReactNode }> = ({ children }) => {
  const api = useContext(PortalContext);
  const key = useId();

  useEffect(() => { api?.set(key, children); });
  useEffect(() => () => api?.set(key, null), [api, key]);

  // Outside a ThemeProvider there is no host: draw in place
  return api === undefined ? <>{children}</> : null;
};
