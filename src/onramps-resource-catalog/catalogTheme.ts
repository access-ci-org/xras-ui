/*
 * The chrome this catalog used to render in.
 *
 * Unlike the components that mount into an ACCESS-themed page, this one has
 * always rendered in a shadow root of its own — and over *stock* Bootstrap 5,
 * not the ACCESS build: `bootstrap-namespaced.scss` compiles Bootstrap with its
 * own defaults, and the ACCESS overrides in `access.scss` are declared on
 * `body, :root`, neither of which a shadow tree has, so they never reached it.
 * Its links and checkboxes are therefore Bootstrap blue and its buttons
 * Bootstrap amber. Restated here rather than taken from `tailwind.css`, whose
 * values are the themed ones, and measured off the published build.
 *
 * The parts the NAIRR catalog needs too live in `@/shared/bootstrap5Theme`,
 * which this file re-exports so that the subproject has one theme import.
 */
import { BTN } from "@/shared/bootstrap5Theme";

export * from "@/shared/bootstrap5Theme";

/** `.card`, whose radius Bootstrap keeps at 6px where Tailwind's is 8px. */
export const CARD =
  "flex flex-col rounded-md border border-border-translucent bg-white";

/** `.shadow`, which the ACCESS build turns off but this one still paints. */
export const CARD_SHADOW = "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)]";

/*
 * `.card-header` and `.card-footer`. The inner radius is the card's less its
 * border, and the header's background is left to the caller: the one place it
 * is used paints a gradient over it.
 */
export const CARD_HEADER =
  "rounded-t-[5px] border-b border-border-translucent px-4 py-2";
export const CARD_FOOTER =
  "rounded-b-[5px] border-t border-border-translucent bg-[rgba(33,37,41,0.03)] px-4 py-2";

/** `.card-body`. */
export const CARD_BODY = "p-4";

/** `.btn-secondary`, as the ACCESS yellow the catalog's own stylesheet forces. */
export const BTN_SECONDARY = `${BTN} border-[#fec42d] bg-[#fec42d] font-bold text-black hover:border-[#feca42] hover:bg-[#fecd4d] focus-visible:ring-[rgba(216,167,38,0.5)]`;

/** `.badge`: em-based, so it scales with whatever it labels. */
export const BADGE =
  "inline-block rounded-md px-[0.65em] py-[0.35em] text-center align-baseline text-[0.75em]/[1] font-bold whitespace-nowrap";
/** `.rounded-pill`, a radius no box in the catalog is tall enough to reach. */
export const BADGE_PILL = "rounded-[50rem]";

/** `.list-group` and `.list-group-item.list-group-item-action`. */
export const LIST_GROUP = "flex flex-col rounded-md";
export const LIST_GROUP_ITEM = [
  "relative block border border-border bg-white px-4 py-2 font-normal text-[#212529] no-underline",
  "first:rounded-t-md last:rounded-b-md [&:not(:first-child)]:border-t-0",
  "hover:bg-[#f8f9fa] hover:text-[#495057]",
].join(" ");

/**
 * The Bootstrap Icons the catalog used to draw sit on the text baseline, a
 * touch below it: `.bi::before` is `vertical-align: -.125em`. Lucide's SVGs
 * need saying so explicitly, and sizing in `em` like a glyph.
 */
export const ICON = "inline size-[1em] align-[-0.125em]";
