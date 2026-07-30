import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Grid, { type GridColumn } from "../shared/Grid";
import InlineButton from "../shared/InlineButton";
import MultiStateCheckbox from "../shared/MultiStateCheckbox";
import PublicationCitation from "./PublicationCitation";
import PublicationEditModal from "./PublicationEditModal";
import PublicationAddButton from "./PublicationAddButton";
import type { PublicationSummary } from "./types";
import {
  editPublicationAtom,
  getPublicationsAtom,
  savingAtom,
  selectedPublicationIdsAtom,
  publicationsAtom,
  toggleSelectedPublicationAtom,
  usePaginationAtom,
} from "./atoms";

export default function PublicationsGrid({
  allowAdd = true,
  allowEdit = true,
  allowSelect = false,
}: {
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowSelect?: boolean;
}) {
  const saving = useAtomValue(savingAtom);
  const selected = useAtomValue(selectedPublicationIdsAtom);
  const setSelected = useSetAtom(selectedPublicationIdsAtom);
  const publications = useAtomValue(publicationsAtom);
  const editPublication = useSetAtom(editPublicationAtom);
  const toggleSelected = useSetAtom(toggleSelectedPublicationAtom);
  const getPublications = useSetAtom(getPublicationsAtom);
  const setUsePagination = useSetAtom(usePaginationAtom);

  // Fetch a new list of publications when a publication is added or edited.
  useEffect(() => {
    if (!saving) {
      setUsePagination(false);
      getPublications();
    }
  }, [saving]);

  const columns: GridColumn[] = [
    {
      key: "publication",
      name: "Publication",
      format: (_value, row) => (
        <>
          <PublicationCitation publication={row as PublicationSummary} />
          {allowEdit && row.can_edit && (
            <InlineButton
              key="edit"
              onClick={() => editPublication(row.publication_id)}
              icon="pencil"
              title="Edit publication"
            />
          )}
        </>
      ),
    },
    {
      key: "created_by",
      name: "Entered By",
      headerClass: "text-nowrap",
    },
  ];

  if (allowSelect)
    columns.splice(0, 0, {
      key: "publication_id",
      format: (value) => {
        const isSelected = selected.includes(value);
        return (
          <input
            type="checkbox"
            name="publication_ids[]"
            value={value}
            checked={isSelected}
            onChange={() => toggleSelected(value)}
          />
        );
      },
      formatHeader: () => (
        <MultiStateCheckbox
          description="all publications"
          selectedLength={selected.length}
          totalLength={publications.length}
          onChange={(checked) =>
            setSelected(checked ? publications.map((pub) => pub.publication_id) : [])
          }
        />
      ),
    });

  return (
    <>
      <Grid columns={columns} rows={publications} scroll={false} />
      {allowAdd && <PublicationAddButton />}
      <PublicationEditModal />
    </>
  );
}
