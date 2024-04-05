import { statuses } from "./helpers/apiSlice";
import { useRequest } from "./helpers/hooks";
import { formatDate, formatRequestName } from "../shared/helpers/utils";

import Alert from "../shared/Alert";
import Modal from "react-bootstrap/Modal";

export default function DeleteModal({ requestId, grantNumber, actionId }) {
  const { deleteAction, request, toggleDeleteModal } = useRequest(
    requestId,
    grantNumber
  );
  if (!request || request.error) return;

  const action = request.actions.find(
    (requestAction) => requestAction.actionId == actionId
  );
  if (!action) return;

  const { deleteStatus, isRequest } = action;
  const pending = deleteStatus == statuses.pending;
  const error = deleteStatus == statuses.error;
  const toggle = () => toggleDeleteModal(actionId);

  return (
    <Modal show={action.showDeleteModal} onHide={toggle} scrollable={true}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert color="danger">
            Deletion of the {isRequest ? "request" : "action"} failed.
          </Alert>
        )}
        <p>
          Are you sure you want to delete{" "}
          {!isRequest && (
            <>
              action{" "}
              <strong>
                {action.type}: {formatDate(action.date)}
              </strong>{" "}
              on{" "}
            </>
          )}
          request <strong>{formatRequestName(request)}</strong>? Deletions
          cannot be undone.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex">
          <button
            type="button"
            className="btn btn-primary me-2"
            onClick={toggle}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => deleteAction(actionId)}
            disabled={pending}
          >
            {pending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
