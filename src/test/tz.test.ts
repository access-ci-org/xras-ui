import { describe, expect, it } from "vitest";
import { formatDate, parseDate } from "@/shared/helpers/utils";

// `vitest.config.ts` pins `test.env.TZ` to "UTC" so date assertions here (and
// in later phases) don't pass locally and fail on a runner in another
// timezone - parseDate() parses local midnight, and formatDate() formats
// through toLocaleString(). This test proves the pin actually took effect
// rather than being silently ignored (Node has been known to cache tz state).
describe("TZ pin", () => {
  it("runs with a UTC-offset-zero local timezone", () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });

  it("parses a date string as UTC local midnight", () => {
    const date = parseDate("2026-08-20");
    expect(date.toISOString()).toBe("2026-08-20T00:00:00.000Z");
  });

  it("formats a date deterministically", () => {
    expect(formatDate("2026-08-20")).toBe("Aug 20, 2026");
  });
});
