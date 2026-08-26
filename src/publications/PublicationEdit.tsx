import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { DialogBody } from "@/components/ui/dialog";
import LoadingSpinner from "../shared/LoadingSpinner";
import PublicationForm from "./PublicationForm";
import PublicationsAlerts from "./PublicationsAlerts";
import { dataLoadedAtom, errorsAtom, getPublicationDataAtom, publicationIdAtom } from "./atoms";

export default function PublicationEdit() {
  const dataLoaded = useAtomValue(dataLoadedAtom);
  const errors = useAtomValue(errorsAtom);
  const publicationId = useAtomValue(publicationIdAtom);
  const getPublicationData = useSetAtom(getPublicationDataAtom);

  useEffect(() => {
    getPublicationData(publicationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicationId]);

  return (
    <>
      {/* Alerts belong to this component rather than to whoever mounts it:
          it renders in the body of the edit modal, and the page-level
          PublicationsAlerts (MyPublications) sits behind the modal backdrop,
          while the standalone `publicationEdit` mount has none at all. That
          left the DOI lookup error and the form's validation error with
          nowhere to go. Sits between DialogHeader and DialogBody, matching
          their `p-4`; `empty:hidden` drops the padding when there is nothing
          to report, without duplicating PublicationsAlerts' own conditions. */}
      <div className="shrink-0 px-4 pt-4 empty:hidden">
        <PublicationsAlerts />
      </div>

      {dataLoaded ? (
        <PublicationForm />
      ) : (
        /* A failed load leaves `dataLoadedAtom` false for good, so a spinner
           was previously the only thing this could ever show. Errors are
           cleared when the modal opens (see `editPublicationAtom`), so
           anything here is this load failing, and the alert above says so. */
        !errors.length && (
          <DialogBody>
            <LoadingSpinner />
          </DialogBody>
        )
      )}
    </>
  );
}
