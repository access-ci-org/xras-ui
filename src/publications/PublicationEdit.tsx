import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import LoadingSpinner from "../shared/LoadingSpinner";
import PublicationForm from "./PublicationForm";
import { dataLoadedAtom, getPublicationDataAtom, publicationIdAtom } from "./atoms";

export default function PublicationEdit() {
  const dataLoaded = useAtomValue(dataLoadedAtom);
  const publicationId = useAtomValue(publicationIdAtom);
  const getPublicationData = useSetAtom(getPublicationDataAtom);

  useEffect(() => {
    getPublicationData(publicationId);
  }, [publicationId]);

  return dataLoaded ? <PublicationForm /> : <LoadingSpinner />;
}
