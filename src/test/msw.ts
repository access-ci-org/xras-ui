// Shared MSW server for tests. Each test that needs the network registers its
// own handlers with `server.use(...)`; anything else must fail loudly rather
// than reach a real host.
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/*
 * `onUnhandledRequest: "error"` alone is NOT sufficient, which is why this
 * catch-all exists. MSW classifies any unhandled request whose pathname ends
 * in a common asset extension as an asset request and returns early *before*
 * applying the unhandled-request strategy, letting it through to the real
 * network. That list includes `json` (see
 * node_modules/msw/lib/core/isCommonAssetRequest.js), and this codebase
 * fetches `.json` URLs all over the place — `${projects_path()}.json`,
 * `/resources/addable.json`, `${usage_detail_path(...)}.json`. Verified
 * against a real host: an unhandled `.json` request reached
 * allocations.access-ci.org and came back 403.
 *
 * A terminal catch-all closes the gap: with it registered, no request is ever
 * "unhandled", so the asset carve-out never applies. `server.use()` prepends,
 * so per-test handlers still win, and `server.resetHandlers()` restores this
 * one. Keep it LAST.
 */
export const server = setupServer(
  http.all(/.*/, ({ request }) => {
    console.error(
      `[test] Blocked unmocked request: ${request.method} ${request.url} — ` +
        `register a handler with server.use() if the test needs it.`,
    );
    return HttpResponse.error();
  }),
);
