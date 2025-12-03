import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { editPublication, getSaving } from "./helpers/publicationEditSlice";
import {
  getPublications,
  selectPublications,
  setUsePagination,
} from "./helpers/publicationsSearchSlice";
import {
  getSelected,
  setSelected,
  toggleSelected,
} from "./helpers/publicationsSelectSlice";

import Grid from "../shared/Grid";
import InlineButton from "../shared/InlineButton";
import MultiStateCheckbox from "../shared/MultiStateCheckbox";
import PublicationCitation from "./PublicationCitation";
import PublicationEditModal from "./PublicationEditModal";
import PublicationAddButton from "./PublicationAddButton";

export default function PublicationsGrid({
  allowAdd = true,
  allowEdit = true,
  allowSelect = false,
}) {
  const dispatch = useDispatch();
  const saving = useSelector(getSaving);
  const selected = useSelector(getSelected) || [];
  const publications = useSelector(selectPublications) || [];

  // Fetch a new list of publications when a publication is added or edited.
  useEffect(() => {
    if (!saving) {
      dispatch(setUsePagination(false));
      dispatch(getPublications());
    }
  }, [saving, dispatch]);

  const columns = [
    {
      key: "publication",
      name: "Publication",
      format: (_value, row) => (
        <>
          <PublicationCitation publication={row} />
          {allowEdit && row.can_edit && (
            <InlineButton
              key="edit"
              onClick={() => dispatch(editPublication(row.publication_id))}
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
        const isSelected = selected?.includes(value) || false;
        return (
          <input
            type="checkbox"
            name="publication_ids[]"
            value={value}
            checked={isSelected}
            onChange={() => dispatch(toggleSelected(value))}
          />
        );
      },
      formatHeader: () => (
        <MultiStateCheckbox
          selectedLength={selected?.length || 0}
          totalLength={publications?.length || 0}
          onChange={(checked) =>
            dispatch(
              setSelected(
                checked ? (publications || []).map((pub) => pub.publication_id) : [],
              ),
            )
          }
        />
      ),
    });

  return (
    <>
      <Grid columns={columns} rows={publications} />
      {allowAdd && <PublicationAddButton />}
      <PublicationEditModal />
    </>
  );
}
