import type { DiscountRate } from "../types";

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function datesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 <= e2 && s2 <= e1;
}

export function validateOverlap(
  currentRate: Pick<DiscountRate, "id" | "begin_date" | "end_date">,
  discountRates: DiscountRate[],
) {
  if (!currentRate.begin_date || !currentRate.end_date) return "";

  const otherRates = discountRates.filter((rate) => rate.id !== currentRate.id);

  for (const rate of otherRates) {
    if (
      rate.begin_date &&
      rate.end_date &&
      datesOverlap(
        currentRate.begin_date,
        currentRate.end_date,
        rate.begin_date,
        rate.end_date,
      )
    ) {
      return `The selected date range (${formatDate(currentRate.begin_date)} to ${formatDate(
        currentRate.end_date,
      )}) overlaps with an existing discount rate (${formatDate(rate.begin_date)} to ${formatDate(
        rate.end_date,
      )})`;
    }
  }
  return "";
}

export type RateDateErrors = Required<
  Pick<DiscountRate, "start_date_error" | "end_date_error">
>;

// One field, in precedence order, first match wins. An empty date is reported
// as such and nothing further is claimed about it; a date outside its own range
// reports only that. Overlap deliberately does not appear here - see below.
function dateError(
  label: "start date" | "end date",
  value: string | undefined,
  minDate: string,
  maxDate: string,
) {
  if (!value) return "Date cannot be empty or invalid";
  if (value < minDate) return `${label} ${value} cannot be before ${minDate}`;
  if (value > maxDate) return `${label} cannot be after ${maxDate}`;
  return "";
}

// Validates a whole candidate rate rather than whichever field was just edited,
// and always returns a message for *both* fields - "" where there is nothing
// wrong. Both of those matter:
//
//   - Returning the complete pair means a caller that patches the result can
//     never leave a message behind after it has stopped being true. The partial
//     writes this replaced could show an admin an overlap complaint quoting a
//     date range they had already replaced.
//   - Validating the candidate makes an inverted range one rule instead of two.
//     The end date's floor is the rate's own begin date when it has one, so
//     "end date X cannot be before Y" comes out the same whichever endpoint the
//     admin moved to invert it, and neither direction is a special case.
//
// Precedence is a list, not the order the assignments happen to run in, which
// is the other half of what went wrong before: an overlap message used to
// overwrite the inverted-range message that had just been computed, so the
// admin was told a backwards range overlapped its neighbour instead of being
// told the range was backwards. Per-field problems therefore rank above
// overlap, and overlap is only checked once both endpoints stand up on their
// own - an overlap between a rate and a range that is not yet coherent is not a
// fact worth reporting.
export function validateRateDates(
  candidate: Pick<DiscountRate, "id" | "begin_date" | "end_date">,
  allRates: DiscountRate[],
  minDate: string,
  maxDate: string,
): RateDateErrors {
  const errors = {
    start_date_error: dateError("start date", candidate.begin_date, minDate, maxDate),
    end_date_error: dateError(
      "end date",
      candidate.end_date,
      candidate.begin_date || minDate,
      maxDate,
    ),
  };
  if (errors.start_date_error || errors.end_date_error) return errors;

  // An overlap is a property of the pair, so it goes on both fields.
  const overlapError = validateOverlap(candidate, allRates);
  return overlapError
    ? { start_date_error: overlapError, end_date_error: overlapError }
    : errors;
}

export function conversionLabel(
  rate: number | string | undefined,
  unitType: string,
) {
  if (!rate || Number(rate) === 0) return "-";
  const unitsPerCredit = 1 / Number(rate);
  return `${unitsPerCredit.toFixed(2)} ${unitType}`;
}

export function collectDateErrors(discountRates: DiscountRate[]) {
  const errors: string[] = [];
  discountRates.forEach((rate) => {
    if (rate.start_date_error) errors.push(rate.start_date_error);
    if (rate.end_date_error) errors.push(rate.end_date_error);
    if (rate.rate_error) errors.push(rate.rate_error);
  });
  return errors.filter(
    (error, index) =>
      error !== "" && (!error.includes("overlaps") || errors.indexOf(error) === index),
  );
}
