import { createContext, useContext } from "react";

// Radix `Portal` components render into `document.body` by default, which
// escapes a Shadow DOM root and loses access to its scoped stylesheet.
// Mount functions that render into a shadow root should provide it here so
// popovers/selects/dialogs portal within the same shadow tree instead.
export const PortalContainerContext = createContext<Element | DocumentFragment | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}
