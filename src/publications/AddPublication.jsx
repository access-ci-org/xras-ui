import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { getSaving, getShowSaved } from "./helpers/selectors";
import { savePublication } from "./helpers/thunks";

import Modal from "react-bootstrap/Modal";
import PublicationEdit from "./PublicationEdit";

const AddPublication = ({
  saving,
  savePublication,
  showSaved,
  updatePublications,
}) => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    if (!saving && showSaved) {
      // Update the list of publications.
      updatePublications();
    }
  }, [saving, showSaved]);
  return (
    <>
      <Modal
        size="xl"
        show={showModal}
        onHide={() => setShowModal(false)}
        scrollable={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Publication</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PublicationEdit />
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex">
            <button
              type="button"
              className="btn btn-danger me-2"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                savePublication();
                setShowModal(false);
              }}
            >
              Save Publication
            </button>
          </div>
        </Modal.Footer>
      </Modal>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setShowModal(true)}
      >
        Add a New Publication
      </button>
    </>
  );
};

const mapStateToProps = (state) => ({
  saving: getSaving(state),
  showSaved: getShowSaved(state),
});

const mapDispatchToProps = (dispatch) => ({
  savePublication: () => dispatch(savePublication()),
});

export default connect(mapStateToProps, mapDispatchToProps)(AddPublication);
