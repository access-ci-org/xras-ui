import { useMemo, type ReactNode } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

import { PortalContainerContext } from "./portal-container";

/**
 * Wires up the two things that break when a render tree lives inside a Shadow
 * Root: Radix portals, which default to `document.body`, and Emotion (used by
 * `react-select`), which appends its generated stylesheet to `document.head`
 * where the shadow tree can't see it.
 *
 * Renders `children` unchanged when `target` is in the light DOM.
 */
export function ShadowRootProvider({ target, children }: { target: Node; children: ReactNode }) {
  const shadowRoot = useMemo(() => {
    const root = target.getRootNode();
    return root instanceof ShadowRoot ? root : null;
  }, [target]);

  const cache = useMemo(
    () =>
      shadowRoot
        ? // Emotion types `container` as an HTMLElement but only ever appends
          // to it, so a ShadowRoot works.
          createCache({ key: "xrasui", container: shadowRoot as unknown as HTMLElement })
        : null,
    [shadowRoot],
  );

  const tree = (
    <PortalContainerContext.Provider value={shadowRoot}>{children}</PortalContainerContext.Provider>
  );

  return cache ? <CacheProvider value={cache}>{tree}</CacheProvider> : tree;
}
