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
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { server } from "./msw";

// --- RTL cleanup -------------------------------------------------------
afterEach(() => cleanup());

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
