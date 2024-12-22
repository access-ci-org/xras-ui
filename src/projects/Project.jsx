import { useState } from "react";
import { useEffect } from "react";
import { useProject } from "./helpers/hooks";
import { formatRequestName } from "./helpers/utils";
import style from "./Project.module.scss";

import Alert from "../shared/Alert";
import Request from "./Request";
import StatusBadge from "../shared/StatusBadge";
import RequestActionButtons from "./RequestActionButtons";

export default function Project({ open = false, grantNumber, title, status }) {
  const [expanded, setExpanded] = useState(open);
  const { project, setRequest } = useProject(
    grantNumber,
    !expanded && title && status && true
  );
  const elementId = `project-${grantNumber}`;
  
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === grantNumber && !expanded) {
        setExpanded(true);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [grantNumber, expanded]);

  let body = null;
  if (expanded && project) {
    if (project.error) {
      body = <Alert color="danger">{project.error}</Alert>;
    } else {
      let selectedRequest;
      const requestOptions = project.requestsList.map((request) => {
        if (request.requestId == project.selectedRequestId)
          selectedRequest = request;
        return (
          <option key={request.requestId} value={request.requestId}>
            {formatRequestName(request)}
          </option>
        );
      });
      body = (
        <>
          <div className="d-flex">
            <select
              className="form-select"
              aria-label="Select a request to display"
              onChange={(e) => setRequest(parseInt(e.target.value, 10))}
              value={project.selectedRequestId}
              disabled={requestOptions.length < 2}
            >
              {requestOptions}
            </select>
            <RequestActionButtons
              requestId={project.selectedRequestId}
              grantNumber={grantNumber}
            />
          </div>
          {selectedRequest ? (
            <Request {...selectedRequest} grantNumber={grantNumber} />
          ) : null}
        </>
      );
    }
  }

  return (
    <div className={`${style.project} card mb-3`}>
      <div
        className={`card-header d-flex justify-content-between ${
          expanded ? "" : "border-bottom-0"
        }`}
      >
        <button
          aria-expanded={expanded}
          aria-controls={elementId}
          className={style.expand}
          onClick={() => setExpanded(!expanded)}
        >
          <h2 className="mb-1 mt-1 text-start">
            <i className={`bi bi-caret-${expanded ? "down" : "right"}-fill`} />{" "}
            {/^[A-Z]/.test(grantNumber) ? (
              <>
                <span className="grant-number">{grantNumber}:</span>{" "}
              </>
            ) : null}
            {title || project.title}
          </h2>
        </button>
        <StatusBadge status={status || project.status} />
      </div>
      <div className="card-body" id={elementId} hidden={!expanded || !project}>
        {body}
      </div>
    </div>
  );
}
