import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  getPublicationsAtom,
  savingAtom,
  updateFilterSelectionAtom,
  usePaginationAtom,
} from "../publications/atoms";
import PublicationEditModal from "../publications/PublicationEditModal";
import PublicationsList from "../publications/PublicationsList";

export default function Publications({ grantNumber }: { grantNumber: string }) {
  const saving = useAtomValue(savingAtom);
  const updateFilterSelection = useSetAtom(updateFilterSelectionAtom);
  const setUsePagination = useSetAtom(usePaginationAtom);
  const getPublications = useSetAtom(getPublicationsAtom);

  useEffect(() => {
    if (!saving) {
      updateFilterSelection({ name: "grantNumber", value: grantNumber });
      setUsePagination(false);
      getPublications();
    }
  }, [grantNumber, saving]);

  return (
    <>
      <PublicationsList emptyMessage="No publications are associated with this project." />
      <PublicationEditModal />
    </>
  );
}
