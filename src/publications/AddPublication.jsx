import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getSaving,
  getShowSaved,
  savePublication,
} from "./helpers/publicationEditSlice";

import Modal from "react-bootstrap/Modal";
import PublicationEdit from "./PublicationEdit";

export default function AddPublication({ updatePublications }) {
  const dispatch = useDispatch();
  const saving = useSelector(getSaving);
  const showSaved = useSelector(getShowSaved);
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
                dispatch(savePublication());
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
}
