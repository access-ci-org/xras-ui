import { useState } from "react";
import Alert from "../shared/Alert";
import StatusBadge from "../shared/StatusBadge";
import { formatRequestName } from "../shared/helpers/utils";
import type { RouteOverrides } from "../shared/routes";
import Request from "./Request";
import RequestActionButtons from "./RequestActionButtons";
import { useProject } from "./helpers/hooks";
import type { RequestListItem } from "./types";

// lucide has no filled caret, and the solid triangle is what the Bootstrap
// build drew here (Bootstrap Icons' `caret-down-fill`/`caret-right-fill`).
function Caret({ down }: { down: boolean }) {
  return (
    <svg
      className="size-[1em] shrink-0 fill-current"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d={
          down
            ? "M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"
            : "m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"
        }
      />
    </svg>
  );
}

export default function Project({
  open = false,
  grantNumber,
  title,
  status,
  routes,
}: {
  open?: boolean;
  grantNumber: string;
  title?: string;
  status?: string;
  routes?: RouteOverrides;
}) {
  const [expanded, setExpanded] = useState(open);
  const { project, setRequest } = useProject(grantNumber, Boolean(!expanded && title && status));
  const elementId = `project-${grantNumber}`;

  let body = null;
  if (expanded && project) {
    if (project.error) {
      body = <Alert color="danger">{project.error}</Alert>;
    } else {
      let selectedRequest: RequestListItem | undefined;
      const requestOptions = project.requestsList.map((request) => {
        if (request.requestId == project.selectedRequestId) selectedRequest = request;
        return (
          <option key={request.requestId} value={request.requestId}>
            {formatRequestName(request)}
          </option>
        );
      });
      body = (
        <>
          <div className="flex">
            <select
              className="select-caret w-full rounded-none border border-input bg-background px-3 py-1.5 disabled:bg-[#e9ecef]"
              aria-label="Select a request to display"
              onChange={(e) => setRequest(parseInt(e.target.value, 10))}
              value={project.selectedRequestId}
              disabled={requestOptions.length < 2}
            >
              {requestOptions}
            </select>
            <RequestActionButtons requestId={project.selectedRequestId} grantNumber={grantNumber} />
          </div>
          {selectedRequest ? (
            <Request requestId={selectedRequest.requestId} grantNumber={grantNumber} routes={routes} />
          ) : null}
        </>
      );
    }
  }

  return (
    <div className="mb-4 border border-border-translucent">
      <div
        className={`flex justify-between bg-teal-200 px-4 py-2 text-primary ${
          expanded ? "border-b border-border-translucent" : ""
        }`}
      >
        <button
          aria-expanded={expanded}
          aria-controls={elementId}
          className="border-0 bg-transparent p-0 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <h2 className="my-1 flex items-center gap-1 text-left text-lg font-bold leading-[1.2]">
            <Caret down={expanded} />
            {/^[A-Z]/.test(grantNumber) ? (
              <>
                <span className="grant-number">{grantNumber}:</span>{" "}
              </>
            ) : null}
            {title || project?.title}
          </h2>
        </button>
        <StatusBadge status={status || project?.status || ""} />
      </div>
      <div className="p-4" id={elementId} hidden={!expanded || !project}>
        {body}
      </div>
    </div>
  );
}
