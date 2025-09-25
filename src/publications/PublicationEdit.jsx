import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getData,
  getDataLoaded,
  getPublicationId,
} from "./helpers/publicationEditSlice";

import ErrorMessages from "./ErrorMessages";
import LoadingSpinner from "../shared/LoadingSpinner";
import PublicationForm from "./PublicationForm";
import SavedMessage from "./SavedMessage";

export default function PublicationEdit() {
  const dispatch = useDispatch();
  const dataLoaded = useSelector(getDataLoaded);
  const publicationId = useSelector(getPublicationId);

  useEffect(() => {
    dispatch(getData(publicationId));
  }, [publicationId, dispatch]);

  return (
    <>
      <SavedMessage />
      <ErrorMessages />
      {dataLoaded ? <PublicationForm /> : <LoadingSpinner />}
    </>
  );
}
