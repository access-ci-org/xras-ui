import { atom } from "jotai";

export type Routes = {
  edit_request_action_path: (requestId: number | string, actionId: number | string) => string;
  edit_request_path: (requestId: number | string) => string;
  how_to_path: () => string;
  get_your_first_project_path: () => string;
  profile_path: () => string;
  project_types_path: () => string;
  projects_path: () => string;
  projects_save_users_path: () => string;
  renew_request_path: (requestId: number | string) => string;
  request_action_path: (requestId: number | string, actionId: number | string) => string;
  request_actions_path: (requestId: number | string) => string;
  request_path: (requestId: number | string) => string;
  resources_path: () => string;
  search_people_path: () => string;
  usage_detail_path: (grantNumber: string, resourceId: number | string) => string;
  publications_dismiss_notice_path: () => string;
  edit_publication_path: (publicationId: number | string) => string;
  publication_path: (publicationId: number | string) => string;
  publications_path: () => string;
  publications_find_project_path: (params?: QueryParams) => string;
  publications_lookup_path: (params?: QueryParams) => string;
  search_publications_path: (params?: QueryParams) => string;
  search_publications_filters_path: () => string;
} & Record<string, (...args: any[]) => string>;

// Rails route helpers take an options hash that becomes the query string.
export type QueryParams = Record<string, unknown>;

// Host-supplied (Rails) route overrides: an arbitrary bag of named route
// helpers, the same shape the old `addRoutes()` helper (removed in favor of
// this module) used to take. Deliberately not `Partial<Routes>`: `Routes`
// carries a string index
// signature, so `Partial` makes every value `| undefined` and the merged
// result stops being assignable to `Routes`. It wouldn't buy any checking
// either - the index signature already admits any route name.
export type RouteOverrides = Record<string, (...args: any[]) => string>;

const baseUrl = "https://allocations.access-ci.org";

// Serialize a Rails route helper's options hash into a query string, matching
// the default serializer js-routes generates in the host app
// (xras_submit_access app/javascript/routes.js): null and undefined are
// dropped, keys and values are URI-encoded, and arrays expand to
// `key[]=a&key[]=b`. That array form is load-bearing - `getPublicationsAtom`
// (src/publications/atoms.ts) passes `created_by` as an array. js-routes also
// expands nested objects as `key[inner]=...`; nothing here passes one, so
// that case is deliberately not reproduced.
function query(params?: QueryParams): string {
  const parts: string[] = [];
  const add = (key: string, value: unknown) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) value.forEach((v) => add(`${key}[]`, v));
    else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };
  if (params) Object.entries(params).forEach(([key, value]) => add(key, value));
  return parts.length ? `?${parts.join("&")}` : "";
}

export const defaultRoutes: Routes = {
  edit_request_action_path: (requestId, actionId) =>
    `/requests/${requestId}/actions/${actionId}/edit`,
  edit_request_path: (requestId) => `/requests/${requestId}/edit`,
  how_to_path: () => "/how-to",
  get_your_first_project_path: () => `${baseUrl}/get-your-first-project`,
  profile_path: () => `${baseUrl}/profile`,
  project_types_path: () => `${baseUrl}/project-types`,
  projects_path: () => `${baseUrl}/projects`,
  projects_save_users_path: () => "/projects/save_users",
  renew_request_path: (requestId) => `${baseUrl}/requests/${requestId}/renew`,
  request_action_path: (requestId, actionId) =>
    `${baseUrl}/requests/${requestId}/actions/${actionId}`,
  request_actions_path: (requestId) => `${baseUrl}/requests/${requestId}/actions`,
  request_path: (requestId) => `${baseUrl}/requests/${requestId}`,
  resources_path: () => `${baseUrl}/resources`,
  search_people_path: () => `${baseUrl}/search/people`,
  usage_detail_path: (grantNumber, resourceId) => `/usage/${grantNumber}/${resourceId}`,
  publications_dismiss_notice_path: () => "/publications/dismiss_notice",

  // The publications feature's routes. Root-relative: five of the seven are
  // `fetch` targets in the host app itself, and keeping `publications_path`
  // relative too makes it work the same as a POST target and as an `href`.
  // Paths verified against `rails routes` in xras_submit_access, which is the
  // app that mounts these widgets - note its dismiss-notice route is declared
  // `as: :dismiss_notice`, so the host aliases it to the name above.
  edit_publication_path: (publicationId) => `/publications/${publicationId}/edit`,
  publication_path: (publicationId) => `/publications/${publicationId}`,
  publications_path: () => "/publications",
  publications_find_project_path: (params) => `/publications/find_project${query(params)}`,
  publications_lookup_path: (params) => `/publications/lookup${query(params)}`,
  search_publications_path: (params) => `/search/publications${query(params)}`,
  search_publications_filters_path: () => "/search/publications/filters",
};

// Reporting routes the host page didn't supply --------------------------
//
// A widget reads its routes from whatever the host page passed to its mount
// function, layered over `defaultRoutes` by `mergeRoutes()`. Two things can
// go wrong, and the route table is wrapped in a `Proxy` to report both:
//
//   - The route resolves, but only because it fell through to
//     `defaultRoutes` - the host didn't supply it. The default is usually
//     correct (these are the real paths xras_submit_access serves), so this
//     `console.warn`s and returns the default. It's a warning rather than an
//     error because the widget genuinely works; what it can't do is survive
//     being mounted on a different app or origin.
//   - The route doesn't exist at all, in the host's `routes` or in
//     `defaultRoutes`. There's nothing to fall back to, so this throws.
//     Before the guard it surfaced as a bare `TypeError:
//     routes.some_path is not a function`, naming neither the route nor the
//     cause. The message distinguishes a store that was never hydrated from
//     one hydrated with an incomplete `routes`.
//
// Only the `get` trap is overridden - not `has`, `ownKeys`, or
// `getOwnPropertyDescriptor` - so `"foo" in routes` checks and
// `{ ...routes }` spreads still see exactly the underlying table's own keys
// and behave like a plain object. One wrinkle: spreading a guarded table
// reads every own key, so it warns for every route the host didn't supply at
// once. Nothing in src does that (`mergeRoutes` spreads the raw
// `defaultRoutes`, not a guarded table) - it only shows up in tests.
//
// The warning is gated on `import.meta.env.DEV`, so it fires while developing
// against this repo (and under vitest) but not in a consumer's browser
// console. Note what that means in practice: this library ships pre-built, so
// Vite replaces `import.meta.env.DEV` with `false` in the published bundle and
// drops the warning entirely - a Rails developer whose mount function omits a
// route sees nothing, and the widget silently uses the default. The throw
// below is *not* gated, so a route missing from both the host's `routes` and
// `defaultRoutes` still fails loudly wherever it runs.
//
// The trap only fires for string keys ending in `_path` - every route this
// codebase or a Rails host ever calls follows that naming convention (see
// `defaultRoutes` below). That's deliberate, not just a style match: jotai,
// React, and Node's own Promise machinery routinely probe plain objects for
// incidental properties they don't have (`then` to check if a value is
// thenable, `toJSON`, `Symbol.iterator`, `constructor`, ...) and silently
// treat a missing one as "no", exactly like a plain object would. Throwing
// on those instead of returning `undefined` broke `store.get(routesAtom)`
// itself, since jotai's internals check `value.then` on every atom read.
// Scoping the guard to the one naming convention real routes use keeps that
// duck-typing intact while still catching the mistake this guard exists for.
function missingRouteMessage(name: string, hydrated: boolean): string {
  return hydrated
    ? `routesAtom has no route named "${name}". This store was hydrated with mergeRoutes(), but neither ` +
        "the host-supplied `routes` nor defaultRoutes (src/shared/routes.ts) define it - check the mount " +
        "function's `routes` prop."
    : `routesAtom has no route named "${name}", and this store's routesAtom was never hydrated - no mount ` +
        "function called mergeRoutes()/useHydrateAtoms against this store, so only defaultRoutes " +
        "(src/shared/routes.ts) is available. Pass a `routes` prop to the mount function, or hydrate " +
        "routesAtom directly.";
}

function defaultedRouteMessage(name: string, hydrated: boolean): string {
  return hydrated
    ? `routesAtom: the host-supplied \`routes\` did not include "${name}", so this widget is falling back ` +
        "to the built-in default from defaultRoutes (src/shared/routes.ts). That default points at the " +
        "path xras_submit_access serves, so it only works when the widget is mounted on that app and on " +
        "the same origin - add `" +
        name +
        "` to the mount function's `routes` option to be sure."
    : `routesAtom: this store's routesAtom was never hydrated, so reading "${name}" fell back to the ` +
        "built-in default from defaultRoutes (src/shared/routes.ts). No mount function called " +
        "mergeRoutes()/useHydrateAtoms against this store - pass a `routes` prop to the mount function, " +
        "or hydrate routesAtom directly.";
}

/*
 * `supplied` is the set of route names the host actually provided, so a read
 * can tell "the host gave me this" from "I'm quietly using the default". The
 * latter warns and then returns the default, rather than throwing: the default
 * is usually right (it's the real xras_submit_access path), so failing hard
 * would be worse than the widget working while telling the developer their
 * mount function is incomplete.
 *
 * The warning is emitted lazily, on first read, instead of eagerly at
 * hydration time by diffing the supplied routes against `defaultRoutes`. That
 * matters for correctness, not just noise: mount functions legitimately supply
 * only the routes their widget uses - `publicationsSelect`, for instance,
 * passes no `search_publications_filters_path` because nothing it renders
 * reaches `getFiltersAtom`. An eager diff would report every such route as
 * missing. Warning on read reports exactly the routes a widget really needs
 * and really wasn't given.
 *
 * Deduped per route name per table (`warned`), so a component re-rendering or
 * an atom refetching can't turn one omission into an unbounded stream of
 * identical warnings. Each `mergeRoutes()` call gets a fresh table and so a
 * fresh dedupe set; the unhydrated table is created once at module load, so
 * its warnings dedupe for the lifetime of the module.
 */
function guardRoutes(routes: Routes, hydrated: boolean, supplied: Set<string>): Routes {
  const warned = new Set<string>();
  return new Proxy(routes, {
    get(target, prop, receiver) {
      if (prop in target) {
        if (
          import.meta.env.DEV &&
          typeof prop === "string" &&
          prop.endsWith("_path") &&
          !supplied.has(prop) &&
          !warned.has(prop)
        ) {
          warned.add(prop);
          console.warn(defaultedRouteMessage(prop, hydrated));
        }
        return Reflect.get(target, prop, receiver);
      }
      // Nothing to fall back to, so this still throws - see
      // `missingRouteMessage` above.
      if (typeof prop !== "string" || !prop.endsWith("_path")) return undefined;
      throw new Error(missingRouteMessage(prop, hydrated));
    },
  });
}

// Per-store route table.
//
// `config.routes` (src/shared/helpers/config.ts) used to be a module-level
// singleton mutated in place by `addRoutes()` (src/shared/helpers/utils.tsx),
// which every mount function in src/main.jsx called with host-supplied
// (Rails) routes. That worked only as long as a page mounted a single
// widget: if it mounted two, the second `addRoutes()` call overwrote the
// first widget's routes out from under it, because there was exactly one
// `config.routes` object for the whole page. Both have since been removed.
//
// A jotai atom's *value* lives in whichever store reads/writes it, and each
// publications mount function already creates its own store (see
// src/main.jsx). Hydrating this atom per store - instead of writing into a
// shared singleton - gives each mounted widget an isolated set of routes, so
// two widgets with different route overrides on the same page can't clobber
// each other. Don't reintroduce a plain module-level export or fold this
// into `config` - that would bring back the cross-mount bug this atom exists
// to fix.
//
// Most route reads happen in the jotai atom layer (plain functions outside
// the React tree, see src/publications/atoms.ts), which is why this is a
// jotai atom rather than React context: context can't reach code that isn't
// part of a component tree.
//
// The initial value is `defaultRoutes` wrapped in the "never hydrated"
// flavor of `guardRoutes` above (see the comment on that function): reading
// an existing default route works normally, but reading anything else means
// this store's `routesAtom` was never hydrated.
export const routesAtom = atom<Routes>(guardRoutes(defaultRoutes, false, new Set()));

// Merge host-supplied (Rails) route overrides over the defaults, ready to
// hydrate `routesAtom` with. Mount functions receive only the routes the
// host page knows about, so the defaults have to stay underneath them - this
// is the same merge behavior the old `addRoutes()` helper had, kept in one
// place so every mount hydrates identically. The result is wrapped in the
// "hydrated" flavor of `guardRoutes` above, so a route missing from both the
// overrides and the defaults still fails with a descriptive error instead of
// a bare `TypeError`.
export function mergeRoutes(routes?: RouteOverrides): Routes {
  return guardRoutes({ ...defaultRoutes, ...routes }, true, new Set(Object.keys(routes ?? {})));
}
