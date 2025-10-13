import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getData,
  getDataLoaded,
  getPublicationId,
} from "./helpers/publicationEditSlice";

import LoadingSpinner from "../shared/LoadingSpinner";
import PublicationForm from "./PublicationForm";

export default function PublicationEdit() {
  const dispatch = useDispatch();
  const dataLoaded = useSelector(getDataLoaded);
  const publicationId = useSelector(getPublicationId);

  useEffect(() => {
    dispatch(getData(publicationId));
  }, [publicationId, dispatch]);

  return <>{dataLoaded ? <PublicationForm /> : <LoadingSpinner />}</>;
}
