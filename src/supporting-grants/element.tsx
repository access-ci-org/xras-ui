import ReactDOM from "react-dom/client";
import type { Root } from "react-dom/client";
import { PortalContainerContext } from "@/lib/portal-container";
import { buildGrantsFormData } from "./form-data";
import { SupportingGrantsSection } from "./SupportingGrantsSection";
import type {
  FosType,
  FundingAgency,
  SupportingGrantAttributes,
  SupportingGrantsState,
} from "./types";

const DEFAULT_NAME = "supporting_grants";
const DEFAULT_TAG_NAME = "supporting-grants-field";
const VALIDATION_MESSAGE = "Supporting grants has validation errors.";

/**
 * Form-associated custom element that lets the supporting grants React
 * widget, mounted in its own shadow root, participate in an ancestor
 * <form>'s native submission and constraint validation even though its
 * inputs live outside the light DOM.
 *
 * `fundingAgencies`, `fosTypes`, `initialGrants`, and
 * `initialIncludeSupportingGrants` are plain JS properties (too complex for
 * HTML attributes) and must be set before the element is inserted into the
 * document, since they're only read once, in connectedCallback.
 */
export class SupportingGrantsElement extends HTMLElement {
  static formAssociated = true;

  static get observedAttributes() {
    return ["name", "include-grants-field-name"];
  }

  fundingAgencies: FundingAgency[] = [];
  fosTypes: FosType[] = [];
  initialGrants?: SupportingGrantAttributes[];
  initialIncludeSupportingGrants?: boolean | null;
  /** Overrides where stylesheet hrefs are resolved from; defaults to this bundle's own directory, matching shadowTarget(). */
  baseUrl: string | null = null;
  /** Stylesheet hrefs (relative to baseUrl, or absolute) to link into the element's shadow root. */
  stylesheets: string[] | null = null;

  private internals: ElementInternals;
  private root: Root | null = null;
  private container: HTMLDivElement;
  private stylesheetsAttached = false;

  constructor() {
    super();
    // element-internals-polyfill's ElementInternals class predates the ARIA
    // element-reflection additions to the DOM lib, so its type doesn't
    // structurally satisfy the (now-augmented) global ElementInternals
    // interface once the polyfill's types are loaded. We only use
    // setFormValue/setValidity, both unaffected by that gap.
    this.internals = this.attachInternals() as unknown as ElementInternals;
    // delegatesFocus so that when the browser tries to focus this control
    // (e.g. reporting a blocked submit via reportValidity()), focus lands
    // on the first focusable field inside the shadow root instead of
    // silently failing — a plain custom element isn't focusable on its
    // own, which otherwise logs "is not focusable" and shows nothing.
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    this.container = document.createElement("div");
    shadow.appendChild(this.container);

    // Firefox's constraint-validation implementation never attempts to
    // focus/report an invalid form-associated custom element at all
    // (unlike Chrome/Safari, which at least try, and successfully focus
    // + show a validation bubble) — the ancestor form's submit is still
    // correctly blocked, but the user gets no visible feedback. The
    // `invalid` event is a separate, earlier step of the same algorithm
    // and fires regardless, so use it to recover the focus ourselves.
    // Defer with setTimeout so this only runs *after* a browser that
    // already handles this correctly (Chrome/Safari) has had its own
    // synchronous focus-and-report step — calling focus() ourselves in
    // that case would race with it and suppress its native bubble.
    this.addEventListener("invalid", () => {
      setTimeout(() => {
        if (!this.matches(":focus-within")) {
          this.focus();
        }
      });
    });
  }

  get name(): string {
    return this.getAttribute("name") ?? DEFAULT_NAME;
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get includeGrantsFieldName(): string | null {
    return this.getAttribute("include-grants-field-name");
  }

  set includeGrantsFieldName(value: string | null) {
    if (value == null) this.removeAttribute("include-grants-field-name");
    else this.setAttribute("include-grants-field-name", value);
  }

  connectedCallback() {
    this.attachStylesheets();
    this.root = ReactDOM.createRoot(this.container);
    this.root.render(
      <PortalContainerContext.Provider value={this.shadowRoot}>
        <SupportingGrantsSection
          fundingAgencies={this.fundingAgencies}
          fosTypes={this.fosTypes}
          initialGrants={this.initialGrants}
          initialIncludeSupportingGrants={this.initialIncludeSupportingGrants}
          onChange={this.handleChange}
          onValidityChange={this.handleValidityChange}
        />
      </PortalContainerContext.Provider>,
    );
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
  }

  // Shadow DOM doesn't inherit the page's stylesheets, so the built
  // tailwind.css (which defines this component's utility classes, design
  // tokens, and shadow-DOM-specific fallbacks) must be linked inside this
  // element's own shadow root.
  private attachStylesheets() {
    if (this.stylesheetsAttached) return;
    this.stylesheetsAttached = true;

    const baseUrl = this.baseUrl ?? import.meta.url.replace(/\/[^/]+$/, "");
    const hrefs = this.stylesheets ?? [this.defaultTailwindHref()];
    for (const href of hrefs) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        href.startsWith("http") || href.startsWith("/")
          ? href
          : `${baseUrl}/${href}`;
      this.shadowRoot!.insertBefore(link, this.container);
    }
  }

  // In a production build, this module ends up bundled into the same
  // dist/ file as everything else, so tailwind.css (a sibling lib entry
  // in vite.config.js) sits right next to it — a plain relative href
  // resolved against baseUrl works. In dev (served by `vite dev`),
  // source files keep their real tree layout instead: tailwind.css
  // lives at src/tailwind.css, not next to this module, and
  // @tailwindcss/vite only serves the *compiled* stylesheet (rather
  // than the raw `@import "tailwindcss"` source) via the `?direct`
  // suffix it expects on direct <link> requests.
  private defaultTailwindHref(): string {
    if (import.meta.env.DEV) {
      return `${new URL("../tailwind.css", import.meta.url).href}?direct`;
    }
    return "tailwind.css";
  }

  private handleChange = ({
    grants,
    includeSupportingGrants,
  }: SupportingGrantsState) => {
    this.internals.setFormValue(
      buildGrantsFormData(
        this.name,
        grants,
        includeSupportingGrants,
        this.includeGrantsFieldName ?? undefined,
      ),
    );
  };

  private handleValidityChange = (isValid: boolean) => {
    if (isValid) {
      this.internals.setValidity({});
    } else {
      this.internals.setValidity(
        { customError: true },
        VALIDATION_MESSAGE,
        this.container,
      );
    }
  };
}

async function ensureFormAssociationSupport(): Promise<void> {
  if (!("attachInternals" in HTMLElement.prototype)) {
    await import("element-internals-polyfill");
  }
}

/**
 * Registers the <supporting-grants-field> custom element, polyfilling
 * ElementInternals first on browsers that don't support it natively
 * (Safari < 16.4, Firefox < 93, Chrome/Edge < 77).
 */
export async function defineSupportingGrantsElement(
  tagName: string = DEFAULT_TAG_NAME,
): Promise<void> {
  await ensureFormAssociationSupport();
  if (!customElements.get(tagName)) {
    customElements.define(tagName, SupportingGrantsElement);
  }
}
