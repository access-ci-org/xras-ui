import Modal from "react-bootstrap/Modal";
import PublicationEdit from "./PublicationEdit";

export default function PublicationEditModal({
  show = false,
  onHide,
  publicationId = null,
}) {
  return (
    <>
      <Modal
        size="xl"
        show={show}
        onHide={() => onHide(false)}
        scrollable={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {publicationId ? "Edit" : "Add"} Publication
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PublicationEdit publicationId={publicationId} />
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex">
            <button
              type="button"
              className="btn btn-danger me-2"
              onClick={() => onHide(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onHide(true)}
            >
              Save Publication
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
