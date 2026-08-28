import { describe, expect, it } from "vitest";
import { validateRateDates } from "./exchangeRates";
import type { DiscountRate } from "../types";

// `validateRateDates` takes its bounds as arguments, so unlike the atom that
// calls it these tests need no relationship to the day they run on. Fixed
// calendar dates make the boundary cases readable.
const MIN = "2026-01-01";
const MAX = "2100-12-31";

function rate(overrides: Partial<DiscountRate> & { id: number }): DiscountRate {
  return { exchange_rate: "1.0", ...overrides };
}

const validate = (
  candidate: Pick<DiscountRate, "id" | "begin_date" | "end_date">,
  allRates: DiscountRate[] = [],
) => validateRateDates(candidate, allRates, MIN, MAX);

describe("validateRateDates", () => {
  it("reports both fields on every call, so no message can outlive its cause", () => {
    // The property the caller depends on: a field with nothing wrong with it
    // gets "", not an absent key. `patchDiscountRate` merges, so an absent key
    // would leave whatever was there before in place.
    expect(validate({ id: 1, begin_date: "2026-03-01", end_date: "2026-04-01" })).toEqual({
      start_date_error: "",
      end_date_error: "",
    });
  });

  it("flags each missing date on its own field", () => {
    expect(validate({ id: 1, end_date: "2026-04-01" })).toEqual({
      start_date_error: "Date cannot be empty or invalid",
      end_date_error: "",
    });
    expect(validate({ id: 1, begin_date: "2026-03-01" })).toEqual({
      start_date_error: "",
      end_date_error: "Date cannot be empty or invalid",
    });
  });

  it("rejects a start date before the floor and a date after the ceiling", () => {
    expect(validate({ id: 1, begin_date: "2025-12-31", end_date: "2026-04-01" })).toEqual({
      start_date_error: `start date 2025-12-31 cannot be before ${MIN}`,
      end_date_error: "",
    });
    expect(validate({ id: 1, begin_date: "2026-03-01", end_date: "2101-01-01" })).toEqual({
      start_date_error: "",
      end_date_error: `end date cannot be after ${MAX}`,
    });
  });

  it("measures the end date against the rate's own begin date once it has one", () => {
    expect(validate({ id: 1, begin_date: "2026-03-01", end_date: "2026-02-01" })).toEqual({
      start_date_error: "",
      end_date_error: "end date 2026-02-01 cannot be before 2026-03-01",
    });
    // With no begin date to measure against, the floor is the global one.
    expect(validate({ id: 1, end_date: "2025-06-01" })).toEqual({
      start_date_error: "Date cannot be empty or invalid",
      end_date_error: `end date 2025-06-01 cannot be before ${MIN}`,
    });
  });

  it("puts the overlap message on both fields once both dates stand up alone", () => {
    const errors = validate({ id: 1, begin_date: "2026-03-01", end_date: "2026-04-01" }, [
      rate({ id: 1, begin_date: "2026-03-01", end_date: "2026-04-01" }),
      rate({ id: 2, begin_date: "2026-03-15", end_date: "2026-05-01" }),
    ]);

    expect(errors.start_date_error).toContain("overlaps with an existing discount rate");
    expect(errors.end_date_error).toBe(errors.start_date_error);
  });

  it("reports an inverted range rather than the overlap it also produces", () => {
    // The regression this ordering exists for. An inverted range can still
    // satisfy `datesOverlap` when a neighbour spans both of its endpoints, and
    // the overlap message used to win because it was assigned last. What the
    // admin then read was a backwards range being blamed on a different rate:
    // "The selected date range (5/1/2026 to 4/1/2026) overlaps with ..." - true
    // of nothing, and silent about the one problem they could act on.
    const errors = validate({ id: 1, begin_date: "2026-05-01", end_date: "2026-04-01" }, [
      rate({ id: 1, begin_date: "2026-05-01", end_date: "2026-04-01" }),
      rate({ id: 2, begin_date: "2026-03-01", end_date: "2026-06-01" }),
    ]);

    expect(errors.end_date_error).toBe("end date 2026-04-01 cannot be before 2026-05-01");
    expect(errors.start_date_error).toBe("");
  });

  it("says nothing about overlap while either date is invalid on its own", () => {
    // Deliberate, and the one place this is not a pure refactor: an overlap
    // between a neighbour and a range that is not yet coherent is not a fact
    // worth reporting, so the per-field problem is the whole answer.
    const errors = validate({ id: 1, begin_date: "2025-01-01", end_date: "2026-04-01" }, [
      rate({ id: 1, begin_date: "2025-01-01", end_date: "2026-04-01" }),
      rate({ id: 2, begin_date: "2026-03-15", end_date: "2026-05-01" }),
    ]);

    expect(errors).toEqual({
      start_date_error: `start date 2025-01-01 cannot be before ${MIN}`,
      end_date_error: "",
    });
  });
});
