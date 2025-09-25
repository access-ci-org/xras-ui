import { useState } from "react";
import { useDispatch } from "react-redux";
import { savePublication } from "../helpers/publicationEditSlice";

export default function useEditPublication() {
  const dispatch = useDispatch();
  const [currentPublicationId, setCurrentPublicationId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const editPublication = (publicationId) => {
    setCurrentPublicationId(publicationId);
    setShowModal(true);
  };

  const handleModalHide = (save) => {
    if (save) dispatch(savePublication());
    setShowModal(false);
  };

  return {
    publicationId: currentPublicationId,
    show: showModal,
    onHide: handleModalHide,
    editPublication,
  };
}
