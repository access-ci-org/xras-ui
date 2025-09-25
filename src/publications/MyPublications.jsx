import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  getFilters,
  getPublications,
} from "./helpers/publicationsSearchSlice.js";

import PublicationAddButton from "./PublicationAddButton.jsx";
import PublicationEditModal from "./PublicationEditModal.jsx";
import PublicationsList from "./PublicationsList";

export default function MyPublications() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getPublications());
    dispatch(getFilters());
  }, [dispatch]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-start">
        <h1>My Publications</h1>
        <PublicationAddButton />
      </div>
      <PublicationsList />
      <PublicationEditModal />
    </>
  );
}
