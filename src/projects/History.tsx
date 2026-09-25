import { ChevronLeft, ChevronRight } from "lucide-react";
import Grid, { type GridColumn } from "../shared/Grid";
import ResourceName from "../shared/ResourceName";
import StatusBadge from "../shared/StatusBadge";
import { formatBoolean, formatRequestName, sortResources } from "../shared/helpers/utils";
import ActionTitle from "./ActionTitle";
import { useProject, useRequest } from "./helpers/hooks";
import type { Action, Resource } from "./types";

const formatNumber = (value: number) => (
  <span className={value < 0 ? "text-destructive" : ""}>{value === 0 ? "" : value.toLocaleString()}</span>
);

export default function History({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, toggleDeleteModal } = useRequest(requestId, grantNumber);
  const { project, setRequest } = useProject(grantNumber || request?.grantNumber);
  if (!request || !project) return null;

  const requests = project.requestsList;

  let requestIdx = 0;
  while (requestIdx < requests.length) {
    if (requests[requestIdx].requestId === requestId) break;
    requestIdx++;
  }
  const prevRequest = requests[requestIdx + 1];
  const nextRequest = requests[requestIdx - 1];

  const navButton = (
    navRequest: (typeof requests)[number] | undefined,
    direction: "prev" | "next",
  ) => {
    if (!navRequest) return <span />;
    return (
      <button
        type="button"
        className="border border-input bg-muted px-2 py-1 text-sm"
        onClick={() => setRequest(navRequest.requestId)}
      >
        {direction == "prev" ? <ChevronLeft className="size-4" /> : null}
        {formatRequestName(navRequest)}
        {direction == "next" ? <ChevronRight className="size-4" /> : null}
      </button>
    );
  };

  const resourceIds = new Set<number>();
  const resources: Resource[] = [];
  for (const action of request.actions)
    for (const resource of action.resources) {
      if (!resourceIds.has(resource.resourceId)) {
        resourceIds.add(resource.resourceId);
        resources.push(resource);
      }
    }

  resources.sort(sortResources);

  const columns: GridColumn[] = [
    {
      key: "action",
      name: "Action Details",
      format: (_value, row) => (
        <ActionTitle action={row as Action} request={request} toggleDeleteModal={toggleDeleteModal} />
      ),
    },
    {
      key: "status",
      name: "Status",
      format: (value) => <StatusBadge status={value} />,
    },
    ...resources.map(
      (res): GridColumn => ({
        key: `resource${res.resourceId}`,
        name: res.name,
        class: "text-right",
        format: res.isBoolean ? (value: boolean) => (value ? formatBoolean(value) : null) : formatNumber,
        formatHeader: () => <ResourceName resource={res} userGuide={false} />,
      }),
    ),
  ];

  const rows = request.actions.map((action) => {
    const row: Record<string, unknown> = { ...action };
    for (const { resourceId } of resources) row[`resource${resourceId}`] = 0;
    for (const { resourceId, requested } of action.resources) row[`resource${resourceId}`] = requested || 0;
    return row;
  });

  return (
    <div>
      <Grid columns={columns} rows={rows} />
      <div className="flex justify-between">
        {navButton(prevRequest, "prev")}
        {navButton(nextRequest, "next")}
      </div>
    </div>
  );
}
