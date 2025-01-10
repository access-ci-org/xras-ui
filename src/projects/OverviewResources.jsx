import { useProject, useRequest } from "./helpers/hooks";
import config from "../shared/helpers/config";
import {
  icon,
  formatBoolean,
  formatDate,
  formatManagers,
  formatNumber,
  resourceColors,
} from "../shared/helpers/utils";

import Grid from "../shared/Grid";
import ResourceName from "../shared/ResourceName";
import StatusBadge from "../shared/StatusBadge";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

export default function OverviewResources({ requestId, grantNumber }) {
  const { request } = useRequest(requestId, grantNumber);
  const { project } = useProject(grantNumber || request.grantNumber);
  const { setTab } = useProject(grantNumber || request.grantNumber);
  if (!request || !project) return;

  let credit;

  // User counts
  const userCounts = {};
  for (let user of project.users || []) {
    for (let resourceId of user.resourceIds) {
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
  const columns = [
    {
      key: "name",
      name: "Resource",
      format: (value, row) => <ResourceName resource={row} />,
    },
    {
      key: "isActive",
      name: "Status",
      format: (value) => <StatusBadge status={value ? "Active" : "Inactive"} />,
    },
    {
      key: "used",
      name: "Balance",
      class: "position-relative",
      format: (used, row) => {
        if (row.isBoolean) return formatBoolean(row.allocated);
        const balance = row.allocated - used;
        const pct = (Math.max(balance, 0) * 100) / row.allocated;
        return (
          <>
            <div
              className={`usage bg-${row.color}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            ></div>
            {formatNumber(balance, { abbreviate: true })} of{" "}
            {formatNumber(row.allocated, { abbreviate: true })} {row.unit}{" "}
            remaining ({Math.round(pct)}%)
          </>
        );
      },
    },
    {
      key: "endDate",
      name: "End Date",
      format: (value) => formatDate(value),
    },
  ];

  if (project.isManager)
    columns.push({
      key: "userCount",
      name: "Users",
      class: "text-end",
      format: formatNumber,
    });

  if (project.currentUser)
    columns.push({
      key: "resourceUsername",
      name: "My Username",
      format: (value, row) => {
        const username = project.currentUser.resourceUsernames[row.resourceId];
        if (username) return username;
        if (
          project.currentUser.resourceAccountPendingIds.includes(row.resourceId)
        )
          return (
            <StatusBadge
              status="Pending"
              title="Creation of your account by the resource provider is pending."
            />
          );
        if (
          project.currentUser.resourceIds.includes(row.resourceId) ||
          !row.isActive
        )
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
        const tooltip = (
          <Tooltip>
            Please contact {formatManagers(project)} to request access to this
            resource.
          </Tooltip>
        );
        return (
          <OverlayTrigger overlay={tooltip}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              Request access
            </a>
          </OverlayTrigger>
        );
      },
    });

  return (
    <div className="overview">
      {canExchange &&
      !hasPreviousExchange &&
      availableCredits > config.creditAlertThreshold ? (
        <button
          onClick={() => setTab("resources")}
          className="alert alert-info d-flex justify-content-between align-items-center w-100"
        >
          <span>
            <span className="fs-3">
              {icon(config.resourceTypeIcons[credit.icon])}{" "}
              {formatNumber(availableCredits)}
            </span>{" "}
            {credit.unit} available
          </span>
          <span className="align-middle d-flex align-items-center">
            Exchange credits for resources!{" "}
            <span className="fs-3">{icon("chevron-right")}</span>
          </span>
        </button>
      ) : null}
      {rows.length ? <Grid columns={columns} rows={rows} /> : null}
    </div>
  );
}
