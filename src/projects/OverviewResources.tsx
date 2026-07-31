import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Grid, { type GridColumn } from "../shared/Grid";
import StatusBadge from "../shared/StatusBadge";
import ResourceName from "../shared/ResourceName";
import config from "../shared/helpers/config";
import {
  icon,
  formatBoolean,
  formatDate,
  formatManagers,
  formatNumber,
  resourceColors,
} from "../shared/helpers/utils";
import { useProject, useRequest } from "./helpers/hooks";
import type { Resource } from "./types";

export default function OverviewResources({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request } = useRequest(requestId, grantNumber);
  const { project, setTab } = useProject(grantNumber || request?.grantNumber);
  if (!request || !project) return null;

  let credit: Resource | undefined;

  // User counts
  const userCounts: Record<number, number> = {};
  for (const user of project.users || []) {
    for (const resourceId of user.resourceIds) {
      userCounts[resourceId] = userCounts[resourceId] || 0;
      userCounts[resourceId] += 1;
    }
  }

  // Grid rows
  const rows = (request.resources || [])
    .filter((res) => {
      if (res.isCredit) {
        credit = res;
        return false;
      }
      return res.allocated > 0;
    })
    .map((res, i) => ({
      ...res,
      userCount: userCounts[res.resourceId] || 0,
      color: resourceColors[i % resourceColors.length],
    }));

  const availableCredits = credit ? credit.allocated : 0;
  const canExchange = "Exchange" in request.allowedActions;
  const hasPreviousExchange = request.exchangeActionId !== null;

  // Grid columns
  const columns: GridColumn[] = [
    {
      key: "name",
      name: "Resource",
      format: (_value, row) => <ResourceName resource={row as Resource} />,
    },
    {
      key: "isActive",
      name: "Status",
      format: (value) => <StatusBadge status={value ? "Active" : "Inactive"} />,
    },
    {
      key: "used",
      name: "Balance",
      class: "relative",
      format: (used, row) => {
        if (row.isBoolean) return formatBoolean(row.allocated);
        const balance = row.allocated - used;
        const pct = (Math.max(balance, 0) * 100) / row.allocated;
        return (
          <>
            <div
              className="absolute inset-y-0 left-0"
              style={{ backgroundColor: row.color, width: `${Math.min(pct, 100)}%` }}
            ></div>
            {formatNumber(balance, { abbreviate: true })} of{" "}
            {formatNumber(row.allocated, { abbreviate: true })} {row.unit} remaining ({Math.round(pct)}%)
          </>
        );
      },
    },
    {
      key: "endDate",
      name: "End Date",
      format: (value) => (value ? formatDate(value) : ""),
    },
  ];

  if (project.isManager)
    columns.push({
      key: "userCount",
      name: "Users",
      class: "text-right",
      format: formatNumber,
    });

  if (project.currentUser)
    columns.push({
      key: "resourceUsername",
      name: "My Username",
      format: (_value, row) => {
        const username = project.currentUser!.resourceUsernames[row.resourceId];
        if (username) return username;
        if (project.currentUser!.resourceAccountPendingIds.includes(row.resourceId))
          return (
            <StatusBadge
              status="Pending"
              title="Creation of your account by the resource provider is pending."
            />
          );
        if (project.currentUser!.resourceIds.includes(row.resourceId) || !row.isActive)
          return <>&mdash;</>;
        if (project.isManager)
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setTab("users");
              }}
            >
              Grant access
            </a>
          );
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                Request access
              </a>
            </TooltipTrigger>
            <TooltipContent>
              Please contact {formatManagers(project)} to request access to this resource.
            </TooltipContent>
          </Tooltip>
        );
      },
    });

  return (
    <div>
      {canExchange && !hasPreviousExchange && credit && availableCredits > config.creditAlertThreshold ? (
        <button
          onClick={() => setTab("resources")}
          className="mb-1 mt-2 flex w-full items-center justify-between border border-sky-500/50 bg-sky-50 p-3 text-sky-900"
        >
          <span>
            <span className="text-2xl">
              {icon(config.resourceTypeIcons.credit)} {formatNumber(availableCredits)}
            </span>{" "}
            {credit.unit} available
          </span>
          <span className="flex items-center align-middle">
            Exchange credits for resources! <span className="text-2xl">{icon("chevron-right")}</span>
          </span>
        </button>
      ) : null}
      {rows.length ? <Grid columns={columns} rows={rows} /> : null}
    </div>
  );
}
