import ReactDOM from "react-dom/client";

import { ShadowRootProvider } from "@/lib/shadow-root";
import { SupportingGrantsSection } from "./SupportingGrantsSection";
import type { SupportingGrantsProps } from "./types";

export function supportingGrants({ target, ...props }: SupportingGrantsProps) {
  ReactDOM.createRoot(target).render(
    <ShadowRootProvider target={target}>
      <SupportingGrantsSection {...props} />
    </ShadowRootProvider>,
  );
}

export type { SupportingGrantsProps } from "./types";
