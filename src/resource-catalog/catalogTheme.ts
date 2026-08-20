/*
 * The chrome this catalog used to render in.
 *
 * It mounts into `xras_submit_nairr`, whose stylesheet is stock Bootstrap 5.3
 * plus a body font and a gradient background — no themed variables — and until
 * this port it rendered in the page itself rather than in a shadow root, so it
 * simply inherited all of that. The shared constants cover the parts it has in
 * common with the on-ramps catalog; the accordion and the table are only used
 * here.
 */
export * from "@/shared/bootstrap5Theme";

/** The host page's body font, which the shadow root's `:host` rule replaces. */
export const HOST_FONT = "font-[family-name:'Nunito_Sans',serif,sans-serif]";

/**
 * `.accordion-item`. Adjacent items share a border, and the first and last
 * round the button inside them so its expanded background keeps their corners.
 */
export const ACCORDION_ITEM = [
  "border border-border bg-white text-[#212529]",
  "first:rounded-t-md last:rounded-b-md [&:not(:first-child)]:border-t-0",
  "first:[&>h3>button]:rounded-t-[5px] last:[&>h3>button]:rounded-b-[5px]",
].join(" ");

/**
 * `.accordion-button`, including the collapsed and expanded states of its
 * chevron. Bootstrap keeps the glow on `:focus` rather than `:focus-visible`,
 * so a click leaves it showing.
 */
export const ACCORDION_BUTTON = [
  "bg-white px-5 py-4 text-base/[1.2] font-normal",
  "focus:z-10 focus:outline-none focus:ring-4 focus:ring-[rgba(13,110,253,0.25)]",
  "data-[state=open]:bg-[#cfe2ff] data-[state=open]:text-[#052c65]",
  "data-[state=open]:shadow-[inset_0_-1px_0_#dee2e6]",
  /* Bootstrap draws the chevron as a 20px background image. */
  "[&>svg]:size-5",
].join(" ");

/** `.accordion-body`. */
export const ACCORDION_BODY = "px-5 py-4";

/**
 * `.table`. Bootstrap gives cells their own color rather than inheriting the
 * body's, and hangs a border under every row including the last.
 */
export const TABLE = "mb-4 w-full border-collapse text-black";
export const TD = "border-b border-border bg-white p-2 align-top";
export const TD_LABEL = `${TD} font-bold`;
