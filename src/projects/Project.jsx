import { useState, useEffect } from "react";
import { useProject } from "./helpers/hooks";
import { formatRequestName } from "./helpers/utils";
import style from "./Project.module.scss";

import Alert from "../shared/Alert";
import Request from "./Request";
import StatusBadge from "../shared/StatusBadge";
import RequestActionButtons from "./RequestActionButtons";

export default function Project({ open = false, grantNumber, title, status, onExpand }) {
  const [expanded, setExpanded] = useState(open);
  const { project, setRequest } = useProject(grantNumber, !expanded);
  const elementId = `project-${grantNumber}`;

  useEffect(() => {
    setExpanded(open);
  }, [open]);
  
  const handleToggle = () => {
    const newState = !expanded;
    setExpanded(newState);

    if (newState && onExpand) {
      onExpand(grantNumber);
    }
  };
  
  const renderProjectBody = () => {
    if (!expanded || !project) return null;
    
    if (project.error) {
      return <Alert color="danger">{project.error}</Alert>;
    }
    
    const requestOptions = project.requestsList.map((request) => (
      <option key={request.requestId} value={request.requestId}>
        {formatRequestName(request)}
      </option>
    ));
    
    const selectedRequest = project.requestsList.find(
      (request) => request.requestId === project.selectedRequestId
    );
    
    return (
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
        {selectedRequest && <Request {...selectedRequest} grantNumber={grantNumber} />}
      </>
    );
  };
  
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
          onClick={handleToggle}
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
        <StatusBadge status={status || project?.status} />
      </div>
      <div className="card-body" id={elementId} hidden={!expanded}>
        {renderProjectBody()}
      </div>
    </div>
  );
}