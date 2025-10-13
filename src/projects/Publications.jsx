import { useDispatch, useSelector } from "react-redux";

import {
  getPublications,
  setUsePagination,
  updateFilterSelection,
} from "../publications/helpers/publicationsSearchSlice";
import { getSaving } from "../publications/helpers/publicationEditSlice";

import PublicationsList from "../publications/PublicationsList";
import { useEffect } from "react";
import PublicationEditModal from "../publications/PublicationEditModal";

export default function Publications({ grantNumber }) {
  const dispatch = useDispatch();
  const saving = useSelector(getSaving);

  useEffect(() => {
    if (!saving) {
      dispatch(
        updateFilterSelection({ name: "grantNumber", value: grantNumber }),
      );
      dispatch(setUsePagination(false));
      dispatch(getPublications());
    }
  }, [grantNumber, saving, dispatch]);

  return (
    <>
      <PublicationsList
        grantNumber={grantNumber}
        emptyMessage="No publications are associated with this project."
      />
      <PublicationEditModal />
    </>
  );
}
