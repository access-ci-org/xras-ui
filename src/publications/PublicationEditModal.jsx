import Modal from "react-bootstrap/Modal";
import PublicationEdit from "./PublicationEdit";
import { useDispatch, useSelector } from "react-redux";
import {
  getShowEditModal,
  getPublicationId,
  savePublication,
  setShowEditModal,
  getSaveEnabled,
  getPublication,
} from "./helpers/publicationEditSlice";

export default function PublicationEditModal() {
  const dispatch = useDispatch();
  const show = useSelector(getShowEditModal);
  const publicationId = useSelector(getPublicationId);
  const saveEnabled = useSelector(getSaveEnabled);
  const publication = useSelector(getPublication);

  const selectedTags = useSelector(
    (state) => state.publicationEdit.selected_tags || {},
  );
  const relatedToResource = publication?.related_to_resource !== false;
  const selectedTagsCount = Object.values(selectedTags).flat().length;
  const tagsOk = !relatedToResource || selectedTagsCount > 0;

  const handleModalHide = (save) => {
    if (save) dispatch(savePublication());
    dispatch(setShowEditModal(false));
  };

  return (
    <>
      <Modal
        size="xl"
        show={show}
        onHide={() => handleModalHide(false)}
        scrollable={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {publicationId ? "Edit" : "Add"} Publication
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PublicationEdit />
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex">
            <button
              type="button"
              className="btn btn-danger me-2"
              onClick={() => handleModalHide(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleModalHide(true)}
              disabled={!(saveEnabled && tagsOk)}
            >
              Save Publication
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
