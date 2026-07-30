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
