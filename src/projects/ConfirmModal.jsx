import { useProject, useRequest } from "./helpers/hooks";
import { getResourceUsagePercent } from "../shared/helpers/utils";

import Modal from "react-bootstrap/Modal";

export default function ConfirmModal({ requestId, grantNumber }) {
  const { request, toggleActionsModal, toggleConfirmModal } = useRequest(
    requestId,
    grantNumber
  );
  const { project } = useProject(grantNumber || request.grantNumber);

  if (!request || !project || request.error || project.error) return;

  const unitName = request.usesCredits ? "credits" : "units";
  const unusedPercent = (1 - getResourceUsagePercent(request)) * 100;

  return (
    <Modal
      size="lg"
      show={request.showConfirmModal}
      onHide={toggleConfirmModal}
      scrollable={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Consider Requesting an Exchange</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <strong>
            {Math.round(unusedPercent)}% of your allocation is unused.
          </strong>{" "}
          Are you sure you want to request more {unitName}? You can exchange{" "}
          {request.usesCredits ? "credits for resources or " : ""} one resource
          for another by changing the <strong>balance</strong> numbers in the
          table on the previous screen.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex">
          <button
            type="button"
            className="btn btn-primary me-2"
            onClick={toggleConfirmModal}
          >
            Return to Exchange
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              toggleConfirmModal();
              toggleActionsModal();
            }}
          >
            Request More {unitName}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
