import config from "./config";

import InlineButton from "../../shared/InlineButton";

export const roundNumber = (value, decimalPlaces, mode = "round") => {
  const roundingFactor = Math.pow(10, decimalPlaces || 0);
  return Math[mode](value * roundingFactor) / roundingFactor;
};

export const parseDate = (dateStr) => new Date(`${dateStr}T00:00:00`);

export const dateOptions = { year: "numeric", month: "short", day: "numeric" };

export const formatDate = (dateStr, options) =>
  parseDate(dateStr).toLocaleString("en-us", options || dateOptions);

export const formatNumber = (
  value,
  { abbreviate = false, decimalPlaces = undefined } = {}
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

export const formatRequestName = (request, options) => {
  if (request.startDate && request.endDate) {
    const start = formatDate(request.startDate, options);
    const end = formatDate(request.endDate, options);
    return `${request.allocationType}: ${start} to ${end}`;
  }
  const entry = formatDate(request.entryDate, options);
  const action = request.status == "Incomplete" ? "Started" : "Submitted";
  return `${request.allocationType}: ${action} ${entry}`;
};

export const icon = (name) => <i className={`bi bi-${name}`} />;

export const parseResourceName = (name) => {
  const matches = name.match(/^([^\(\)]+) (\(([^\)]+)\))?$/);
  return { full: name, short: (matches && matches[3]) || null };
};

export const formatResource = (res, { userGuide = true } = {}) => {
  const { full, short } = parseResourceName(res.name);
  const displayName = short ? <abbr title={full}>{short}</abbr> : full;
  return (
    <>
      {icon(config.resourceTypeIcons[res.icon])} {displayName}
      {!res.isCredit && res.userGuideUrl && userGuide ? (
        <InlineButton
          icon="book"
          href={res.userGuideUrl}
          target="_blank"
          title={`${res.name} User Guide`}
        />
      ) : null}
    </>
  );
};

const getSortResourceName = (res) => {
  const parsed = parseResourceName(res.name);
  return parsed.short || parsed.full;
};

export const sortResources = (a, b) =>
  a.isCredit > b.isCredit ||
  a.isActive > b.isActive ||
  getSortResourceName(a) < getSortResourceName(b)
    ? -1
    : 1;

export const coalesce = (...values) => {
  for (let value of values)
    if (value !== undefined && value !== null) return value;
  return null;
};

export const formatArray = (items, conjunction = "and", separator = ", ") =>
  items.reduce((result, item, i) => (
    <>
      {result}
      {items.length - 1 > i ? separator : ` ${conjunction} `}
      {item}
    </>
  ));

export const formatBoolean = (value) => {
  return value ? <>{icon("check-circle")} Yes</> : <>{icon("x-circle")} No</>;
};

export const formatManagers = (project) =>
  formatArray(
    project.users
      .filter(({ role }) =>
        ["pi", "co_pi", "allocation_manager"].includes(role)
      )
      .map((user) => `${user.firstName} ${user.lastName}`),
    "or"
  );

export const singularize = (name, count) => {
  return count == 1 && name.endsWith("s") ? name.slice(0, -1) : name;
};

export const getResourceUsagePercent = (request) => {
  let total = 0;
  let used = 0;

  for (let res of request.resources) {
    if (res.isBoolean) continue;
    total += res.allocated * res.unitCost;
    used += Math.min(res.used, res.allocated) * res.unitCost;
  }

  return total > 0 ? used / total : 0;
};

export const roles = [
  { role: "pi", name: "PI", xrasRole: "PI" },
  { role: "co_pi", name: "Co-PI", xrasRole: "CoPI" },
  {
    role: "allocation_manager",
    name: "Allocation Manager",
    xrasRole: "Allocation Manager",
  },
  { role: "user", name: "User", xrasRole: "User" },
];

export const acctRolesMap = {};
for (let role of roles) acctRolesMap[role.role] = role;

export const xrasRolesMap = {};
for (let { role, xrasRole } of roles) xrasRolesMap[role] = xrasRole;

export const resourceColors = [
  "info",
  "success",
  "secondary",
  "warning",
  "danger",
];

export function getCost(res, type = "total") {
  const differenceUnitCost =
    res.exchangeRates[res.requested <= res.allocated ? "base" : "current"]
      .unitCost;
  let cost = (res.requested - res.allocated) * differenceUnitCost;
  if (type != "total") return cost;
  return cost + res.allocated * res.exchangeRates.base.unitCost;
}
