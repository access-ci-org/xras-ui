import type { ReactNode } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Coins,
  Cpu,
  HardDrive,
  User,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ProjectSummary, RequestSummary } from "../types";

// Keyed by the same identifiers `config.resourceTypeIcons`/`config.roleIcons`
// already used for Bootstrap Icon names, so those config values didn't need
// to change when the icon set moved to lucide-react.
const icons: Record<string, LucideIcon> = {
  "cash-coin": Coins,
  "cpu-fill": Cpu,
  "hdd-fill": HardDrive,
  "person-square": User,
  "person-fill-check": UserCheck,
  "person-fill-add": UserPlus,
  "person-fill-gear": UserCog,
  "people-fill": Users,
  "chevron-right": ChevronRight,
  "check-circle": CheckCircle2,
  "x-circle": XCircle,
  calendar3: Calendar,
};

export const roundNumber = (
  value: number,
  decimalPlaces?: number,
  mode: "round" | "floor" | "ceil" = "round",
) => {
  const roundingFactor = Math.pow(10, decimalPlaces || 0);
  return Math[mode](value * roundingFactor) / roundingFactor;
};

export const parseDate = (dateStr: string) => new Date(`${dateStr}T00:00:00`);

export const dateOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions) =>
  parseDate(dateStr).toLocaleString("en-us", options || dateOptions);

export const formatNumber = (
  value: number,
  { abbreviate = false, decimalPlaces = undefined }: { abbreviate?: boolean; decimalPlaces?: number } = {},
) => {
  if (abbreviate) {
    let power = 0;
    while (Math.abs(value) / Math.pow(1000, power) >= 1000) power += 1;
    const suffix = ["", "K", "M", "B", "T", "Q"][power];
    return `${(value / Math.pow(1000, power)).toLocaleString("en-US", {
      maximumSignificantDigits: 3,
    })}${suffix}`;
  }
  return value.toLocaleString("en-US", {
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: decimalPlaces,
  });
};

export const formatRequestName = (
  request: RequestSummary,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (request.startDate && request.endDate) {
    const start = formatDate(request.startDate, options);
    const end = formatDate(request.endDate, options);
    return `${request.allocationType}: ${start} to ${end}`;
  }
  const entry = formatDate(request.entryDate, options);
  const action = request.status == "Incomplete" ? "Started" : "Submitted";
  return `${request.allocationType}: ${action} ${entry}`;
};

export const icon = (name: string) => {
  const Icon = icons[name];
  return Icon ? <Icon className="inline-block size-[1em] align-[-0.125em]" /> : null;
};

export const parseResourceName = (name: string) => {
  const matches = name.match(/^([^()]+) (\(([^)]+)\))?$/);
  return { full: name, short: (matches && matches[3]) || null };
};

const getSortResourceName = (res: { name: string }) => {
  const parsed = parseResourceName(res.name);
  return parsed.short || parsed.full;
};

// Tiered comparator: credit resources first, then active ones, then by
// display name. Each tier returns as soon as it finds a difference and falls
// through only on a tie.
//
// The previous implementation OR-ed three `a.field > b.field` checks into a
// single `? -1 : 1`. That never returned +1 to mean "b wins this tier", so a
// tier that favored `b` fell through and let a *later* tier decide - a
// non-credit resource could sort ahead of a credit one on name alone. It also
// never returned 0, so it was not antisymmetric: sortResources(x, y) and
// sortResources(y, x) could both return -1. Array.prototype.sort requires a
// consistent comparator and gives implementation-defined output without one,
// so multi-field ordering was effectively undefined.
export const sortResources = (
  a: { isCredit?: boolean; isActive?: boolean; name: string },
  b: { isCredit?: boolean; isActive?: boolean; name: string },
) => {
  // Subtract b from a so that `true` (1) sorts first.
  const byCredit = Number(b.isCredit ?? false) - Number(a.isCredit ?? false);
  if (byCredit) return byCredit;

  const byActive = Number(b.isActive ?? false) - Number(a.isActive ?? false);
  if (byActive) return byActive;

  // Kept as codepoint comparison rather than localeCompare to preserve the
  // name ordering this has always produced; switching is a separate call.
  const nameA = getSortResourceName(a);
  const nameB = getSortResourceName(b);
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

export const coalesce = <T,>(...values: (T | null | undefined)[]): T | null => {
  for (const value of values) if (value !== undefined && value !== null) return value;
  return null;
};

export const formatArray = (items: ReactNode[], conjunction = "and", separator = ", ") =>
  items.reduce((result: ReactNode, item, i) => (
    <>
      {result}
      {items.length - 1 > i ? separator : ` ${conjunction} `}
      {item}
    </>
  ));

export const formatBoolean = (value: boolean) => {
  return value ? (
    <>{icon("check-circle")} Yes</>
  ) : (
    <>{icon("x-circle")} No</>
  );
};

export const formatManagers = (project: ProjectSummary) =>
  formatArray(
    project.users
      .filter(({ role }) => ["pi", "co_pi", "allocation_manager"].includes(role))
      .map((user) => `${user.firstName} ${user.lastName}`),
    "or",
  );

export const singularize = (name: string, count: number) => {
  return count == 1 && name.endsWith("s") ? name.slice(0, -1) : name;
};

export const formatExchangeRate = (unit: string, unitCost: number, creditResourceName: string) =>
  `${formatNumber(unitCost)} ${singularize(creditResourceName, unitCost)} / ${singularize(unit, 1)}`;

export const getResourceUsagePercent = (request: {
  resources: {
    isBoolean?: boolean;
    allocated: number;
    used: number;
    exchangeRates: { base: { unitCost: number } };
  }[];
}) => {
  let total = 0;
  let used = 0;

  for (const res of request.resources) {
    if (res.isBoolean) continue;
    const { unitCost } = res.exchangeRates.base;
    total += res.allocated * unitCost;
    used += Math.min(res.used, res.allocated) * unitCost;
  }

  return total > 0 ? used / total : 0;
};

export const roles = [
  { role: "pi", name: "PI", xrasRole: "PI" },
  { role: "co_pi", name: "Co-PI", xrasRole: "CoPI" },
  { role: "allocation_manager", name: "Allocation Manager", xrasRole: "Allocation Manager" },
  { role: "user", name: "User", xrasRole: "User" },
] as const;

export const acctRolesMap: Record<string, (typeof roles)[number]> = {};
for (const role of roles) acctRolesMap[role.role] = role;

export const xrasRolesMap: Record<string, string> = {};
for (const { role, xrasRole } of roles) xrasRolesMap[role] = xrasRole;

// Matches the old Bootstrap theme palette (see the removed src/bootstrap/access.scss
// $info/$secondary/$warning/$danger overrides, and Bootstrap's default $success),
// used to distinguish resource bars/segments in charts. Consumers apply these as
// inline styles rather than Tailwind classes since the set is data-driven.
export const resourceColors = ["#00a8d1", "#198754", "#fec42d", "#ef7537", "#a70000"];

export function getCost(
  res: {
    requested: number;
    allocated: number;
    exchangeRates: { base: { unitCost: number }; current: { unitCost: number } };
  },
  type: "total" | "difference" = "total",
) {
  const differenceUnitCost =
    res.exchangeRates[res.requested <= res.allocated ? "base" : "current"].unitCost;
  const cost = (res.requested - res.allocated) * differenceUnitCost;
  if (type != "total") return cost;
  return cost + res.allocated * res.exchangeRates.base.unitCost;
}
