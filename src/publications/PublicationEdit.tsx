import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { DialogBody } from "@/components/ui/dialog";
import LoadingSpinner from "../shared/LoadingSpinner";
import PublicationForm from "./PublicationForm";
import { dataLoadedAtom, getPublicationDataAtom, publicationIdAtom } from "./atoms";

export default function PublicationEdit() {
  const dataLoaded = useAtomValue(dataLoadedAtom);
  const publicationId = useAtomValue(publicationIdAtom);
  const getPublicationData = useSetAtom(getPublicationDataAtom);

  useEffect(() => {
    getPublicationData(publicationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicationId]);

  return dataLoaded ? (
    <PublicationForm />
  ) : (
    <DialogBody>
      <LoadingSpinner />
    </DialogBody>
  );
}
