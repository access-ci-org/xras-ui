/*
 * The stock Bootstrap 5 chrome, for the subprojects whose previous appearance
 * came from a stock Bootstrap page rather than from the ACCESS theme — the two
 * resource catalogs. Restated here rather than taken from `tailwind.css`, whose
 * values are the themed ones, and measured off the published builds.
 *
 * The catalogs render in shadow roots, so nothing of the host page's Bootstrap
 * reaches them: see `bootstrap5.module.scss` for the typography half of this.
 */

/** `.row` and its `> *`: a 24px gutter, half of it hung off each edge. */
export const ROW = "-mx-3 flex flex-wrap";
export const COL = "w-full px-3";

/**
 * `.btn`.
 *
 * Deliberately no border color or font weight here: Tailwind orders utilities
 * by kind rather than by where they appear in the class list, so a variant
 * cannot count on overriding one the base already set.
 */
export const BTN = [
  "inline-block rounded-md border px-3 py-1.5 text-center align-middle",
  "text-base/[1.5] no-underline",
  "focus-visible:outline-none focus-visible:ring-4",
  "disabled:pointer-events-none disabled:opacity-65",
].join(" ");

/** `.btn` on its own: transparent, in the body color. */
export const BTN_DEFAULT = `${BTN} border-transparent text-[#212529] focus-visible:ring-[rgba(13,110,253,0.25)]`;
/** `.btn-warning`, which is Bootstrap's amber here and not the ACCESS orange. */
export const BTN_WARNING = `${BTN} border-[#ffc107] bg-[#ffc107] text-black hover:border-[#ffc720] hover:bg-[#ffca2c] focus-visible:ring-[rgba(217,164,6,0.5)]`;
/** `.btn-outline-primary`. */
export const BTN_OUTLINE_PRIMARY = `${BTN} border-[#0d6efd] text-[#0d6efd] hover:bg-[#0d6efd] hover:text-white focus-visible:ring-[rgba(13,110,253,0.5)]`;

/**
 * `.form-check`. Bootstrap floats the input into the row's left padding; a flex
 * row lands it in the same place, 8px clear of the label.
 */
export const FORM_CHECK = "mb-0.5 flex min-h-6";
export const FORM_CHECK_INPUT =
  "mt-1 shrink-0 rounded-[0.25em] border-input bg-white focus-visible:border-[#86b7fe] focus-visible:ring-[rgba(13,110,253,0.25)] data-[state=checked]:border-[#0d6efd] data-[state=checked]:bg-[#0d6efd]";
export const FORM_CHECK_LABEL = "ml-2 inline-block";

/** `.spinner-border`, at its default 2rem, spinning once every 0.75s. */
export const SPINNER =
  "inline-block size-8 animate-spin rounded-full border-4 border-current border-r-transparent align-[-0.125em] [animation-duration:0.75s]";
