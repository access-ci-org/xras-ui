import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Alert from "../shared/Alert";
import StatusBadge from "../shared/StatusBadge";
import { formatRequestName } from "../shared/helpers/utils";
import Request from "./Request";
import RequestActionButtons from "./RequestActionButtons";
import { useProject } from "./helpers/hooks";
import type { RequestListItem } from "./types";

export default function Project({
  open = false,
  grantNumber,
  title,
  status,
}: {
  open?: boolean;
  grantNumber: string;
  title?: string;
  status?: string;
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
              className="h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 shadow-sm"
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
            <Request requestId={selectedRequest.requestId} grantNumber={grantNumber} />
          ) : null}
        </>
      );
    }
  }

  return (
    <div className="mb-3 border">
      <div className={`flex justify-between p-3 ${expanded ? "border-b" : ""}`}>
        <button
          aria-expanded={expanded}
          aria-controls={elementId}
          className="border-0 bg-transparent p-0"
          onClick={() => setExpanded(!expanded)}
        >
          <h2 className="mb-1 mt-1 flex items-center gap-1 text-start">
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
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
      <div className="p-3" id={elementId} hidden={!expanded || !project}>
        {body}
      </div>
    </div>
  );
}
