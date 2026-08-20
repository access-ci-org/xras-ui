import adminGridStyle from "./adminGrid.module.scss";

/*
 * xras_admin is still on Bootstrap 2.3 with the bootswatch "cerulean" theme,
 * and until the `resources`, `editResource` and `keywords` components moved
 * into a shadow root they took their chrome from the page: a 14px/20px
 * Helvetica body, gradient buttons, Telex headings, `.table`, `.alert` and
 * 30px-tall inputs. The shadow root deliberately keeps the host page's CSS
 * out, so these classes restate the values the components used to inherit,
 * measured off the rendered Bootstrap build.
 *
 * They describe xras_admin's theme rather than the design system, which is why
 * they live here and not in `components/ui`: only the three xras_admin
 * subprojects import them.
 *
 * Note the explicit `rounded-[4px]` throughout: Tailwind's bare `rounded` is
 * 8px here, twice the theme's radius.
 */

/**
 * `body`, and the root of every xras_admin component: `tailwind.css` points
 * `:host` at Archivo and #232323, and Preflight has form controls inherit
 * their font, so setting the stack here is enough for the whole subtree.
 */
export const ADMIN_BODY =
  "font-[family-name:'Helvetica_Neue',Helvetica,Arial,sans-serif] text-[14px]/[20px] text-[#555]";

/** `p`, which `tailwind.css` would otherwise size at 18px/30px. */
export const ADMIN_P = "mb-[10px] text-[14px]/[20px]";

/**
 * `h2` and `h3`, which the theme sets in Telex off a 14px root. The app's own
 * stylesheet tightens `h2` by a full pixel per character, which is what makes
 * these headings measurably narrower than the same string set normally.
 */
export const ADMIN_H2 =
  "my-[10px] font-[Telex,sans-serif] text-[16.8px]/[16.8px] font-normal tracking-[-1px] text-[indianred]";
export const ADMIN_H3 =
  "my-[10px] font-[Telex,sans-serif] text-[24.5px]/[24.5px] font-bold text-[#317eac]";

/**
 * `.btn`. Bootstrap 2 paints a vertical gradient with an inset highlight. The
 * `:hover` rules only change `background-color`, which the gradient covers, so
 * they are left out: the theme's buttons do not visibly react to hover.
 * `.btn-sm` is a Bootstrap 3 class and does nothing here, so a `btn-sm` in the
 * markup these components replaced was full height too.
 */
const ADMIN_BTN = [
  "inline-block cursor-pointer rounded-[4px] border border-black/10 border-b-black/25 px-3 py-1",
  "text-center text-[14px]/[20px] font-normal no-underline",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_1px_2px_rgba(0,0,0,0.05)]",
  "disabled:cursor-default disabled:opacity-65 disabled:shadow-none",
].join(" ");

/** `.btn` on its own is the light default; the rest are the bootswatch colors. */
export const ADMIN_BTN_DEFAULT = `${ADMIN_BTN} border-[#ccc] border-b-[#b3b3b3] bg-white text-[#333] [text-shadow:0_1px_1px_rgba(255,255,255,0.75)]`;
const ADMIN_BTN_COLOR = "text-white [text-shadow:0_-1px_0_rgba(0,0,0,0.25)]";
export const ADMIN_BTN_PRIMARY = `${ADMIN_BTN} ${ADMIN_BTN_COLOR} bg-[#3daae9] bg-[linear-gradient(#46aeea,#2fa4e7)]`;
export const ADMIN_BTN_SUCCESS = `${ADMIN_BTN} ${ADMIN_BTN_COLOR} bg-[#7bb33d] bg-[linear-gradient(#80bb3f,#73a839)]`;
export const ADMIN_BTN_WARNING = `${ADMIN_BTN} ${ADMIN_BTN_COLOR} bg-[#ec5c00] bg-[linear-gradient(#f76000,#dd5600)]`;
export const ADMIN_BTN_DANGER = `${ADMIN_BTN} ${ADMIN_BTN_COLOR} bg-[#d41e24] bg-[linear-gradient(#dd1f26,#c71c22)]`;

/**
 * `i.fa.fa-plus`, the glyph in this app's "add" buttons: 11px wide, and inline
 * because Preflight makes an `svg` a block.
 */
export const ADMIN_BTN_ICON = "inline-block size-[11px] align-baseline";

/** Two buttons in a cell sit 5px apart in this app's markup. */
export const ADMIN_BTN_GAP = "mr-[5px]";

/**
 * The box every form control shares. Bootstrap 2 sizes controls with a
 * content-box 206px width, which a border-box 220px reproduces, and gives them
 * 10px of bottom margin; a disabled one is grey.
 */
const ADMIN_FIELD =
  "mb-[10px] inline-block rounded-[4px] border border-[#ccc] bg-white px-[6px] py-1 text-[14px]/[20px] text-[#555] disabled:bg-[#f5f5f5]";

/**
 * The inset shadow and blue focus glow Bootstrap 2 gives text fields. A
 * `select` gets neither, keeping the browser's own focus ring.
 */
const ADMIN_FIELD_GLOW =
  "shadow-[inset_0_1px_1px_rgba(0,0,0,0.075)] focus:border-[rgba(82,168,236,0.8)] focus:shadow-[inset_0_1px_1px_rgba(0,0,0,0.075),0_0_8px_rgba(82,168,236,0.6)] focus:outline-none";

export const ADMIN_INPUT = `${ADMIN_FIELD} ${ADMIN_FIELD_GLOW} h-[30px] w-[220px]`;
/**
 * A `textarea` takes its height from `rows` off the theme's 20px line, and is
 * aligned to the top of its line box: on the baseline, a multi-line control
 * leaves room for the line's descenders underneath it.
 */
export const ADMIN_TEXTAREA = `${ADMIN_FIELD} ${ADMIN_FIELD_GLOW} w-[220px] align-top`;
export const ADMIN_SELECT = `${ADMIN_FIELD} h-[30px] w-[220px]`;

/**
 * Bootstrap 2's fluid grid, which these forms size their fields with: at the
 * 1170px container `.span8` is 770px and `.span4` 370px, and the proportion
 * holds at the theme's two narrower container widths. `max-w-full` is the one
 * addition — it keeps a field inside a container narrower than the grid, as the
 * CIDeR import modal is, instead of overflowing it.
 */
export const ADMIN_SPAN8 = "w-[770px] max-w-full";
export const ADMIN_SPAN4 = "w-[370px] max-w-full";

/**
 * `.input-prepend` and its `.add-on`: a unit label butted against the left edge
 * of the field, sharing its border. The wrapper zeroes the font size to close
 * the whitespace gap between the two inline blocks. Bootstrap 2 gives the label
 * a content-box `min-width: 16px`, which with its padding and border is the
 * 28px here.
 */
export const ADMIN_INPUT_PREPEND = "mb-[10px] inline-block text-[0px]";
export const ADMIN_ADDON =
  "-mr-px inline-block h-[30px] min-w-[28px] rounded-l-[4px] border border-[#ccc] bg-[#f5f5f5] px-[5px] py-1 text-center text-[14px]/[20px] text-[#555] [text-shadow:0_1px_0_#fff]";
/** The field that follows an `.add-on`, which drops its own left corners. */
export const ADMIN_ADDON_INPUT = "mb-0 rounded-l-none";

/** `label`, a block with 5px beneath it. */
export const ADMIN_LABEL = "mb-[5px] block text-[14px]/[20px] font-normal text-[#555]";

/** `.help-block`: the `small` explaining a field, at Bootstrap's 85%. */
export const ADMIN_HELP =
  "mb-[10px] block text-[11.9px]/[20px] font-normal text-[#7b7b7b]";

/** `.table`: cells separated by top borders, and 20px of space underneath. */
export const ADMIN_TABLE = "mb-5 w-full max-w-full border-collapse";
export const ADMIN_TH = "p-2 text-left align-bottom font-bold";
export const ADMIN_TD = "border-t border-[#ddd] p-2 text-left align-top";
/**
 * `.table-bordered`, which draws the vertical rules with a left border on every
 * cell — hence the table's own missing left border — and so has to stop the
 * borders collapsing. The corner cells are rounded to match the table, so that
 * the leftmost rule curves into its top and bottom borders. Bootstrap leaves
 * the top-right corner square whenever the last header cell is a `td`, as it
 * is in this app's tables, so that corner is left alone here too.
 */
export const ADMIN_TABLE_BORDERED = [
  "border-separate border-spacing-0 rounded-[4px] border border-l-0 border-[#ddd]",
  "[&_td]:border-l [&_td]:border-l-[#ddd] [&_th]:border-l [&_th]:border-l-[#ddd]",
  "[&_thead_tr:first-child_th:first-child]:rounded-tl-[4px]",
  "[&_tbody_tr:last-child_td:first-child]:rounded-bl-[4px]",
  "[&_tbody_tr:last-child_td:last-child]:rounded-br-[4px]",
].join(" ");

/*
 * `.checkbox`: the box floated out of the label's 20px left padding, one
 * checkbox per line. Preflight zeroes the box's default margins, so the 4px
 * that lines it up with the first line of text is restated, and it resets
 * `accent-color` to the theme's primary, which Bootstrap 2 never did.
 */
export const ADMIN_CHECKBOX_LABEL =
  "mb-[5px] block min-h-5 cursor-pointer pt-[5px] pl-5 text-left";
export const ADMIN_CHECKBOX =
  "float-left mt-1 -ml-5 size-[13px] cursor-pointer [accent-color:auto]";

/*
 * `.form-inline .checkbox`, which drops the padding and margin and puts the
 * box 3px to the left of the text instead. Wrap each in its own block element
 * to keep one per line, as `.control-group` did.
 */
export const ADMIN_CHECKBOX_LABEL_INLINE =
  "mb-0 inline-block min-h-5 cursor-pointer pt-[5px] text-left align-middle";
export const ADMIN_CHECKBOX_INLINE =
  "float-left mt-1 mr-[3px] size-[13px] cursor-pointer [accent-color:auto]";

/**
 * `.alert`, whose bare form is the theme's warning colors — Bootstrap 2 has no
 * `.alert-warning`, so `alert-warning` in the markup landed here.
 */
export const ADMIN_ALERT =
  "mb-5 rounded-[4px] border border-[#efb99e] bg-[#f1ceab] py-2 pr-[35px] pl-[14px] text-[#dd5600] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]";
export const ADMIN_ALERT_SUCCESS =
  "mb-5 rounded-[4px] border border-[#d2e6ab] bg-[#d5ecbf] py-2 pr-[35px] pl-[14px] text-[#669533] [text-shadow:0_1px_0_rgba(255,255,255,0.5)]";

/**
 * Passed to `Grid` as `classes`: the table border and the Bootstrap 2 metrics
 * for the controls it renders, which live in a CSS module for the reasons its
 * header explains. `ADMIN_GRID_WIDE_FIELDS` is the exchange rates grid's
 * slightly wider field padding.
 */
export const ADMIN_GRID = adminGridStyle["admin-grid"];
export const ADMIN_GRID_WIDE_FIELDS = adminGridStyle["wide-fields"];

/**
 * `.warning-banner`, the caution notice `AdvancedSettingsSection` lays over the
 * settings it is protecting, and the content underneath it while it shows.
 */
export const ADMIN_WARNING_BANNER =
  "flex items-center justify-between rounded-[4px] border border-[#ffeeba] bg-[#fff3cd] p-3 text-[#856404] shadow-[0_2px_4px_rgba(0,0,0,0.1)]";
export const ADMIN_WARNING_BANNER_OVERLAY =
  "absolute inset-x-4 top-1/2 z-10 -translate-y-1/2";
/**
 * The compact form, for a section guarding a single field: in flow rather than
 * overlaid, and sized by a content-box 18px height the taller button overflows.
 */
export const ADMIN_WARNING_BANNER_COMPACT =
  "relative mb-4 box-content h-[18px] max-w-[750px]";
export const ADMIN_BLURRED = "pointer-events-none blur-[4px] brightness-[0.95]";

/**
 * `.modal`: a 6px-rounded panel, 600px wide inside its border, with a header
 * and footer that do not scroll. Bootstrap 2's `.modal` also carries
 * `top: 50%; left: 50%; margin: -250px 0 0 -280px`, which in this markup — it
 * means to center the panel with flexbox — left it 21px right of and 120px
 * below center. The shadow root does not inherit those rules, so the panel is
 * simply centered here.
 */
export const ADMIN_MODAL =
  "inset-0 m-auto h-fit max-h-[90%] w-[90%] max-w-[600px] rounded-[6px] border-[rgba(0,0,0,0.3)] bg-white";
export const ADMIN_MODAL_HEADER =
  "relative shrink-0 border-b border-[#eee] px-[15px] py-[9px]";
export const ADMIN_MODAL_TITLE = `${ADMIN_H3} m-0 text-[24.5px]/[30px] normal-case`;
/**
 * `.close`, whose glyph the modal markup sets in the theme's danger red — at
 * `.close`'s own 20% opacity, so it reads as pink until hovered. It is floated
 * in the original, so it is out of flow here too: otherwise its 2px of offset
 * would make the header taller than its title.
 */
export const ADMIN_MODAL_CLOSE =
  "absolute top-[11px] right-[15px] cursor-pointer border-0 p-0 font-[Telex,sans-serif] text-[24.5px]/[30px] font-bold text-[#c71c22] opacity-20 outline-none [text-shadow:0_1px_0_#fff] hover:opacity-40";
export const ADMIN_MODAL_BODY = "p-[15px]";
export const ADMIN_MODAL_FOOTER =
  "block rounded-b-[6px] border-t border-[#e5e5e5] bg-[#f8f9fa] p-[15px] text-right";

/**
 * The wrapper the CIDeR import modal puts around `ResourceForm`. Its 770px
 * `span8` fields are wider than the modal body, which the original narrows to
 * `calc(100% - 15px)` — the body's padding on the far side — rather than to the
 * full width, so the fields end up visually inset.
 */
export const ADMIN_MODAL_FORM =
  "relative [&_input]:max-w-[calc(100%-15px)] [&_select]:max-w-[calc(100%-15px)] [&_textarea]:max-w-[calc(100%-15px)]";
