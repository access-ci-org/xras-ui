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

const suffixes = ["", "K", "M", "B", "T", "Q"];

// `abbreviate` and `decimalPlaces` are two answers to the same question, and
// Intl resolves the pair by silently dropping the fraction digits, so a call
// passing both would quietly ignore one of its own arguments. The union makes
// that a compile error instead: each option configures exactly one mode.
type FormatNumberOptions =
  | { abbreviate: true; sigFigs?: number; decimalPlaces?: never }
  | { abbreviate?: false; decimalPlaces?: number; sigFigs?: never };

export const formatNumber = (value: number, options: FormatNumberOptions = {}) => {
  if (options.abbreviate) {
    const sigFigs = options.sigFigs ?? 3;

    // Infinity would otherwise drive the loop until Math.pow overflows and
    // then divide Infinity by Infinity, printing "NaNundefined".
    if (!Number.isFinite(value)) return String(value);

    const maxPower = suffixes.length - 1;
    let power = 0;
    while (Math.abs(value) / Math.pow(1000, power) >= 1000 && power < maxPower) power += 1;

    // The tier comes from the unrounded value, so rounding can push the
    // mantissa back over the boundary: 999_500 is 999.5K unrounded but 1.00M
    // once rounded to three figures. Promote a tier when that happens - and
    // stop at the last suffix rather than indexing past it.
    if (Math.abs(Number((value / Math.pow(1000, power)).toPrecision(sigFigs))) >= 1000 && power < maxPower)
      power += 1;

    return `${(value / Math.pow(1000, power)).toLocaleString("en-US", {
      // Trailing zeros carry information once a suffix is in play: 999_500 to
      // three figures is 1.00M, and "1M" claims one. An unabbreviated value is
      // exact, so there is no retained precision to declare and no padding.
      minimumSignificantDigits: power > 0 ? sigFigs : undefined,
      maximumSignificantDigits: sigFigs,
    })}${suffixes[power]}`;
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits: options.decimalPlaces,
    minimumFractionDigits: options.decimalPlaces,
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

// Resource names arrive as "Bridges-2 (Bridges2)" - a display name with an
// abbreviation in parentheses - and callers render the short form under an
// <abbr> titled with the full one.
//
// Trimming does the real work: it stops a trailing space from costing the
// caller its abbreviation, and it stops "  (Bridges2)" from reporting an
// abbreviation for a string with no name in it. With the input trimmed the old
// regex's optional `(...)` group is unreachable - it could only match as absent
// when the string ended in whitespace - so it is required here, which is the
// same behavior spelled honestly. The inner class excludes both parens rather
// than just ")", so an unbalanced "Foo ((Bar)" is left unparsed instead of
// yielding short: "(Bar".
//
// Genuinely ambiguous input stays unparsed: "Foo (Bar) (Baz)" and "Foo (B(a)r)"
// have no one obvious abbreviation, and every caller falls back to `full`, so
// null degrades to showing the name as-is.
export const parseResourceName = (name: string) => {
  const full = name.trim();
  const matches = full.match(/^[^()]+\s+\(([^()]+)\)$/);
  return { full, short: matches?.[1] ?? null };
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

// Joins items into "a, b or c". The reduce runs with no initial value on
// purpose - that is what returns a lone item unwrapped, and what keeps the
// separator *between* items rather than emitting one ahead of the first. The
// cost is that an empty array throws ("Reduce of empty array with no initial
// value"), so it gets its own early return: callers render the result straight
// into a sentence, where nothing to say should print nothing, not crash the
// component. `formatManagers` below is the one that can actually hit this.
export const formatArray = (items: ReactNode[], conjunction = "and", separator = ", ") => {
  if (!items.length) return null;

  return items.reduce((result: ReactNode, item, i) => (
    <>
      {result}
      {items.length - 1 > i ? separator : ` ${conjunction} `}
      {item}
    </>
  ));
};

export const formatBoolean = (value: boolean) => {
  return value ? (
    <>{icon("check-circle")} Yes</>
  ) : (
    <>{icon("x-circle")} No</>
  );
};

// Callers render this mid-sentence ("Please contact ... to request a change"),
// so an empty result would leave a hole in the sentence. Name the roles
// generically instead - it still tells the reader who to go looking for.
export const noManagers = "your PI, Co-PI, or Allocation Manager";

export const formatManagers = (project: ProjectSummary) => {
  const names = project.users
    .filter(({ role }) => ["pi", "co_pi", "allocation_manager"].includes(role))
    .map((user) => `${user.firstName} ${user.lastName}`);

  return names.length ? formatArray(names, "or") : noManagers;
};

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
