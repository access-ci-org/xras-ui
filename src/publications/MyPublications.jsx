import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFilters,
  getPublications,
  setUsePagination,
} from "./helpers/publicationsSearchSlice.js";

import PublicationAddButton from "./PublicationAddButton.jsx";
import PublicationEditModal from "./PublicationEditModal.jsx";
import PublicationsList from "./PublicationsList";
import PublicationsAlerts from "./PublicationsAlerts.jsx";
import { getSaving } from "./helpers/publicationEditSlice.js";
import PublicationNoNewPublicationsButton from "./PublicationNoNewPublicationsButton.jsx";

export default function MyPublications() {
  const dispatch = useDispatch();
  const saving = useSelector(getSaving);

  useEffect(() => {
    if (!saving) {
      dispatch(setUsePagination(false));
      dispatch(getPublications());
      dispatch(getFilters());
    }
  }, [dispatch, saving]);

  return (
    <>
      <PublicationsAlerts />
      <div className="d-flex justify-content-between align-items-start">
        <h1>My Publications</h1>
        <PublicationAddButton />
        <PublicationNoNewPublicationsButton/>
      </div>
      <PublicationsList />
      <PublicationEditModal />
    </>
  );
}
