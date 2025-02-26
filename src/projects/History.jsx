import { useProject, useRequest } from "./helpers/hooks";
import {
  formatBoolean,
  formatRequestName,
  sortResources,
} from "../shared/helpers/utils";

import ActionTitle from "./ActionTitle";
import Grid from "../shared/Grid";
import ResourceName from "../shared/ResourceName";
import StatusBadge from "../shared/StatusBadge";

const formatNumber = (value) => (
  <span className={value < 0 ? "text-danger" : ""}>
    {value === 0 ? "" : value.toLocaleString()}
  </span>
);

export default function History({ requestId, grantNumber }) {
  const { request, toggleDeleteModal } = useRequest(requestId, grantNumber);
  const { project, setRequest } = useProject(
    grantNumber || request.grantNumber
  );
  if (!request || !project) return;

  const requests = project.requestsList;

  let requestIdx = 0;
  while (requestIdx < requests.length) {
    if (requests[requestIdx].requestId === requestId) break;
    requestIdx++;
  }
  const prevRequest = requests[requestIdx + 1];
  const nextRequest = requests[requestIdx - 1];

  const navButton = (request, direction) => {
    if (!request) return <span />;
    return (
      <button
        type="button"
        className="btn btn-light btn-sm"
        onClick={() => setRequest(request.requestId)}
      >
        {direction == "prev" ? <i className="bi bi-chevron-left" /> : null}
        {formatRequestName(request)}
        {direction == "next" ? <i className="bi bi-chevron-right" /> : null}
      </button>
    );
  };

  const resourceIds = new Set();
  const resources = [];
  for (let action of request.actions)
    for (let resource of action.resources) {
      if (!resourceIds.has(resource.resourceId)) {
        resourceIds.add(resource.resourceId);
        resources.push(resource);
      }
    }

  resources.sort(sortResources);

  const columns = [
    {
      key: "action",
      name: "Action Details",
      format: (value, row) => (
        <ActionTitle
          action={row}
          request={request}
          toggleDeleteModal={toggleDeleteModal}
        />
      ),
    },
    {
      key: "status",
      name: "Status",
      format: (value) => <StatusBadge status={value} />,
    },
    ...resources.map((res) => ({
      key: `resource${res.resourceId}`,
      name: res.name,
      icon: res.icon,
      class: "text-end",
      format: res.isBoolean
        ? (value) => (value ? formatBoolean(value) : null)
        : formatNumber,
      formatHeader: (name, column) => (
        <ResourceName resource={column} userGuide={false} />
      ),
    })),
  ];

  const rows = request.actions.map((action) => {
    const row = { ...action };
    for (let { resourceId } of resources) row[`resource${resourceId}`] = 0;
    for (let { resourceId, approved, requested } of action.resources)
      row[`resource${resourceId}`] = approved || requested || 0;
    return row;
  });

  return (
    <div className="history">
      <Grid columns={columns} rows={rows} />
      <div className="buttons d-flex justify-content-between">
        {navButton(prevRequest, "prev")}
        {navButton(nextRequest, "next")}
      </div>
    </div>
  );
}
