import { formatDate, formatExchangeRate } from "./helpers/utils";

const yearSuffix = `, ${new Date().getFullYear()}`;

export default function DiscountBadge({
  creditResource,
  resource,
  short = false,
}) {
  const { base, current } = resource.exchangeRates;
  if (current.unitCost >= base.unitCost) return;

  const icon = current.endDate ? "calendar3" : "people-fill";
  const color = current.endDate ? "primary" : "success";

  const pctOff = Math.round(
    (100 * (base.unitCost - current.unitCost)) / base.unitCost
  );
  let text = `${pctOff}%`;
  let title = text;
  if (current.endDate) {
    const endDate = current.endDate
      ? ` off until ${formatDate(current.endDate).replace(yearSuffix, "")}`
      : "";
    if (!short) text += endDate;
    title += endDate;
  } else {
    if (!short) text += " for you";
    title += current.institutionType
      ? ` off for researchers from ${current.institutionType}`
      : " off for you";
  }

  title += `: ${formatExchangeRate(
    resource.unit,
    current.unitCost,
    creditResource.name
  )}`;

  return (
    <span
      className={`badge text-bg-${color} ms-2`}
      title={title}
      style={{ cursor: "help" }}
    >
      <i className={`bi bi-${icon} me-1`} />
      {text}
    </span>
  );
}
