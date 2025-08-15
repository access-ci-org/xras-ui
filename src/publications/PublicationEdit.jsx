import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getData, getDataLoaded } from "./helpers/publicationEditSlice";

import ErrorMessages from "./ErrorMessages";
import LoadingSpinner from "../shared/LoadingSpinner";
import PublicationForm from "./PublicationForm";
import SavedMessage from "./SavedMessage";

export default function PublicationEdit() {
  const dispatch = useDispatch();
  const dataLoaded = useSelector(getDataLoaded);

  useEffect(() => {
    dispatch(getData());
  }, []);

  return (
    <>
      <SavedMessage />
      <ErrorMessages />
      {dataLoaded ? <PublicationForm /> : <LoadingSpinner />}
    </>
  );
}
