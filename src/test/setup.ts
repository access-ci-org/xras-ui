// Vitest setup file (see vitest.config.ts `test.setupFiles`). Runs once per
// test file, before any test in it.

// --- Web API polyfills MSW needs under jsdom -------------------------------
//
// jsdom omits several Web Streams / messaging APIs that `@mswjs/interceptors`
// (which MSW v2 uses to patch `fetch`) touches on import or on first request.
// Node 22 has all of these on `globalThis` outside of jsdom, but the jsdom
// test environment doesn't inherit them, so polyfill from Node's own
// implementations *before* importing anything from `msw`. jsdom 30 already
// implements TextEncoder/TextDecoder, so only the stream/messaging pieces are
// missing here.
import { ReadableStream, TransformStream, WritableStream } from "node:stream/web";
import { BroadcastChannel } from "node:worker_threads";

if (!globalThis.ReadableStream) globalThis.ReadableStream = ReadableStream as never;
if (!globalThis.WritableStream) globalThis.WritableStream = WritableStream as never;
if (!globalThis.TransformStream) globalThis.TransformStream = TransformStream as never;
if (!globalThis.BroadcastChannel) globalThis.BroadcastChannel = BroadcastChannel as never;

import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup, configure, prettyDOM } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { server } from "./msw";

// --- RTL cleanup -------------------------------------------------------
afterEach(() => cleanup());

// --- RTL async queries against a shadow root ------------------------------
//
// The mount-function tests (src/main.test.tsx) query through
// `host.shadowRoot`, since that's where every mount function renders. That
// makes a `findBy*`/`waitFor` timeout fatal to the whole run rather than to
// the one test, for two compounding reasons in
// @testing-library/dom's wait-for.js:
//
//  1. On timeout it builds the failure message via
//     `getConfig().getElementError(message, container)`, and the default
//     implementation calls `prettyDOM(container)`, which throws
//     `TypeError: Expected an element or document but got ShadowRoot` -
//     a ShadowRoot has no `outerHTML`. That throw happens *inside the
//     `setTimeout` callback*, so it escapes as an unhandled error instead of
//     rejecting the query's promise.
//  2. Because the throw pre-empts `onDone`, the polling interval and the
//     MutationObserver are never torn down. They keep retrying, the element
//     usually does show up a moment later, and the promise resolves - so the
//     awaiting test *passes*. The run then fails on an unhandled error with
//     no test attached to it.
//
// A ShadowRoot-safe `getElementError` fixes both halves: nothing throws, so
// the timeout rejects the query normally and the failure lands on the test
// that caused it, with a readable dump.
configure({
  getElementError: (message, container) => {
    // `prettyDOM` needs an Element or Document. For a ShadowRoot (or a
    // DocumentFragment) print its element children instead; that's the
    // rendered tree, which is what makes the message useful.
    const dump =
      container && "outerHTML" in container
        ? prettyDOM(container as Element)
        : [...((container as ParentNode | null)?.children ?? [])]
            .map((child) => prettyDOM(child as Element))
            .join("\n");

    const error = new Error([message, dump].filter(Boolean).join("\n\n"));
    error.name = "TestingLibraryElementError";
    return error;
  },

  // Mounting a whole app - shadow root, stylesheets, jotai hydration and the
  // MSW-served fetches it kicks off - can take longer than the 1000ms
  // default, especially under `--coverage`'s instrumentation. That timing
  // margin is what made the failure above intermittent. Stay below vitest's
  // 5000ms `testTimeout` so a query that genuinely never matches still
  // reports the RTL message naming the element, not a bare test timeout.
  asyncUtilTimeout: 3000,
});

// --- Radix / jsdom polyfills ---------------------------------------------
//
// jsdom lacks several APIs Radix primitives (select, dialog, popover,
// dropdown-menu, tooltip, tabs, accordion, checkbox, radio-group, label,
// calendar/date-picker) call when opening/positioning. Each of these is
// exercised indirectly by the Radix smoke test in
// src/components/ui/dialog.test.tsx.

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

class IntersectionObserverStub {
  root = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver;

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function hasPointerCapture() {
    return false;
  };
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
}

// jsdom has no PointerEvent implementation; Radix dispatches pointer events
// on open/close/hover. A MouseEvent-based stand-in carries enough of the
// shape (pointerId/pointerType/button) for Radix's handlers to run.
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventStub extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  globalThis.PointerEvent = PointerEventStub as unknown as typeof PointerEvent;
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// --- maplibregl global stub -------------------------------------------
//
// The host page loads maplibre-gl as a plain script tag; it's declared as a
// bare global in src/vite-env.d.ts and is NOT an npm dependency here.
// src/allocations-map/AllocationsMap.tsx calls `new maplibregl.Map(...)` in a
// layout effect on mount. It isn't meaningfully unit-testable in jsdom (no
// WebGL), so this stub only needs to keep that code path from throwing.
// `maplibregl` is declared `const` (src/vite-env.d.ts), so it can't be
// assigned directly - go through `globalThis` typed loosely instead.
const globalWithMaplibre = globalThis as unknown as { maplibregl?: typeof maplibregl };
globalWithMaplibre.maplibregl ??= {
  Map: class MapStub {
    on() {}
    off() {}
    remove() {}
    resize() {}
    setStyle() {}
  } as unknown as new (options: Record<string, unknown>) => unknown,
};

// --- MSW ------------------------------------------------------------------
//
// `onUnhandledRequest: "error"` is load-bearing: it's what mechanically
// guarantees the suite can never depend on a live XRAS service or on
// https://allocations.access-ci.org. An unhandled request must fail loudly
// rather than hang or silently pass through.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
