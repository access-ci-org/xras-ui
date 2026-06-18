import ReactDOM from "react-dom/client";

import { PortalContainerContext } from "@/lib/portal-container";
import { SupportingGrantsSection } from "./SupportingGrantsSection";
import type { SupportingGrantsProps } from "./types";

export function supportingGrants({ target, ...props }: SupportingGrantsProps) {
  const rootNode = target.getRootNode();
  const portalContainer = rootNode instanceof ShadowRoot ? rootNode : null;

  ReactDOM.createRoot(target).render(
    <PortalContainerContext.Provider value={portalContainer}>
      <SupportingGrantsSection {...props} />
    </PortalContainerContext.Provider>,
  );
}

export type { SupportingGrantsProps } from "./types";
