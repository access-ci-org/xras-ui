import { Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { badgeColorClasses } from "./helpers/badgeColors";
import { formatDate, formatExchangeRate } from "./helpers/utils";
import type { Resource } from "./types";

const yearSuffix = `, ${new Date().getFullYear()}`;

export default function DiscountBadge({
  creditResource,
  resource,
  short = false,
}: {
  creditResource: { name: string };
  resource: Resource;
  short?: boolean;
}) {
  const { base, current } = resource.exchangeRates;
  if (current.unitCost >= base.unitCost) return null;

  const Icon = current.endDate ? Calendar : Users;
  const color = current.endDate ? "primary" : "success";

  const pctOff = Math.round((100 * (base.unitCost - current.unitCost)) / base.unitCost);
  let text = `${pctOff}% off`;
  let title = text;
  if (current.endDate) {
    const endDate = current.endDate ? ` until ${formatDate(current.endDate).replace(yearSuffix, "")}` : "";
    if (!short) text += endDate;
    title += endDate;
  } else {
    if (!short) text += " for you";
    title += current.institutionType ? ` for researchers from ${current.institutionType}` : " for you";
  }

  title += `: ${formatExchangeRate(resource.unit, current.unitCost, creditResource.name)}`;

  return (
    <span
      title={title}
      className={cn(
        "ml-2 inline-flex cursor-help items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        badgeColorClasses[color],
      )}
    >
      <Icon className="size-3.5" />
      {text}
    </span>
  );
}
