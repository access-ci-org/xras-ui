import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sortResources, startScrolling, stopScrolling } from "@/resources/helpers/utils";
import type { ResourceListItem } from "@/resources/types";

function item(overrides: Partial<ResourceListItem> = {}): ResourceListItem {
  return { resource_id: 1, display_resource_name: "A", resource_repository_key: null, relative_order: 1, ...overrides };
}

describe("sortResources", () => {
  it("sorts by relative_order ascending when both are set", () => {
    const a = item({ resource_id: 1, relative_order: 2 });
    const b = item({ resource_id: 2, relative_order: 1 });
    expect(sortResources([a, b]).map((r) => r.resource_id)).toEqual([2, 1]);
  });

  it("sorts a null relative_order after any non-null one, regardless of input order", () => {
    const withOrder = item({ resource_id: 1, relative_order: 5 });
    const withoutOrder = item({ resource_id: 2, relative_order: null });
    expect(sortResources([withoutOrder, withOrder]).map((r) => r.resource_id)).toEqual([1, 2]);
    expect(sortResources([withOrder, withoutOrder]).map((r) => r.resource_id)).toEqual([1, 2]);
  });

  it("falls back to alphabetical-by-name when both relative_orders are null", () => {
    const zeta = item({ resource_id: 1, display_resource_name: "Zeta", relative_order: null });
    const alpha = item({ resource_id: 2, display_resource_name: "Alpha", relative_order: null });
    expect(sortResources([zeta, alpha]).map((r) => r.resource_id)).toEqual([2, 1]);
  });

  it("does not mutate the input array", () => {
    const original = [item({ resource_id: 1, relative_order: 2 }), item({ resource_id: 2, relative_order: 1 })];
    const copy = [...original];
    sortResources(original);
    expect(original).toEqual(copy);
  });
});

describe("startScrolling / stopScrolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("scrolls in the given direction every 16ms until stopped", () => {
    const ref = { current: null };
    startScrolling(1, ref);
    vi.advanceTimersByTime(16 * 3);
    expect(window.scrollBy).toHaveBeenCalledTimes(3);
    expect(window.scrollBy).toHaveBeenLastCalledWith(0, 10);

    stopScrolling(ref);
    vi.advanceTimersByTime(16 * 3);
    expect(window.scrollBy).toHaveBeenCalledTimes(3); // no further calls after stopping
    expect(ref.current).toBeNull();
  });

  it("scales the per-tick scroll amount by direction (negative for scrolling up)", () => {
    const ref = { current: null };
    startScrolling(-1, ref);
    vi.advanceTimersByTime(16);
    expect(window.scrollBy).toHaveBeenCalledWith(0, -10);
  });

  it("does not start a second interval while one is already running", () => {
    const ref = { current: null };
    startScrolling(1, ref);
    const firstInterval = ref.current;
    startScrolling(1, ref); // should be a no-op
    expect(ref.current).toBe(firstInterval);
  });

  it("stopScrolling is a safe no-op when nothing is running", () => {
    const ref = { current: null };
    expect(() => stopScrolling(ref)).not.toThrow();
    expect(ref.current).toBeNull();
  });
});
