import { describe, expect, it } from "vitest";

/*
 * Guards the suite's core isolation property: no test may reach a real host,
 * so CI never depends on the dev environment or another XRAS application.
 *
 * The `.json`/`.js`/`.css` cases are regression tests, not paranoia. MSW's
 * `onUnhandledRequest: "error"` skips requests it treats as static assets,
 * and `json` is on that list — so before the catch-all handler in
 * src/test/msw.ts, every one of these escaped to the real network.
 */
describe("network isolation", () => {
  const urls = [
    // Asset-extension paths: these are the ones MSW would otherwise let out.
    "https://allocations.access-ci.org/projects.json",
    "http://localhost:3001/resources/addable.json",
    "https://example.com/app.js",
    "https://example.com/a.css",
    // A plain path, covered by onUnhandledRequest on its own.
    "https://example.com/plain",
  ];

  it.each(urls)("blocks unmocked request to %s", async (url) => {
    await expect(fetch(url)).rejects.toThrow();
  });
});
