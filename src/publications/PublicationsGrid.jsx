import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getSaving, getShowSaved } from "./helpers/publicationEditSlice";
import {
  getAuthors,
  getPublications,
  setAuthors,
  addAuthor,
  removeAuthor,
  updatePublications,
} from "./helpers/publicationsSearchSlice";
import {
  getSelected,
  setSelected,
  toggleSelected,
} from "./helpers/publicationsSelectSlice";
import useEditPublication from "./hooks/useEditPublication";

import Grid from "../shared/Grid";
import InlineButton from "../shared/InlineButton";
import MultiStateCheckbox from "../shared/MultiStateCheckbox";
import PublicationCitation from "./PublicationCitation";
import PublicationEditModal from "./PublicationEditModal";

export default function PublicationsGrid({
  allowAdd = true,
  allowEdit = true,
  allowSelect = false,
  usernames = [],
  selectedPublicationIds = [],
}) {
  const dispatch = useDispatch();
  const saving = useSelector(getSaving);
  const showSaved = useSelector(getShowSaved);
  const authors = useSelector(getAuthors);
  const selected = useSelector(getSelected);
  const publications = useSelector(getPublications);
  const { editPublication, ...modalProps } = useEditPublication();

  // Initialize state with props if needed
  useEffect(() => {
    if (usernames.length > 0 && authors.length === 0) {
      dispatch(setAuthors(usernames));
    }
  }, [usernames, authors.length, dispatch]);

  useEffect(() => {
    if (selectedPublicationIds.length > 0 && selected.length === 0) {
      dispatch(setSelected(selectedPublicationIds));
    }
  }, [selectedPublicationIds, selected.length, dispatch]);

  // Fetch a new list of publications when the author usernames change.
  useEffect(() => {
    dispatch(updatePublications());
  }, [authors, dispatch]);

  // Fetch a new list of publications when a publication is added or edited.
  useEffect(() => {
    if (!saving && showSaved) dispatch(updatePublications());
  }, [saving, showSaved, dispatch]);

  // Attach event listeners to detect when users are added to
  // or removed from the request.
  useEffect(() => {
    addEventListener("requestAddRole", (e) =>
      dispatch(addAuthor(e.detail.username)),
    );
    addEventListener("requestRemoveRole", (e) =>
      dispatch(removeAuthor(e.detail.username)),
    );
  }, [dispatch]);

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
            onChange={() => dispatch(toggleSelected(value))}
          />
        );
      },
      formatHeader: () => (
        <MultiStateCheckbox
          selectedLength={selected.length}
          totalLength={publications.length}
          onChange={(checked) =>
            dispatch(
              setSelected(
                checked ? publications.map((pub) => pub.publication_id) : [],
              ),
            )
          }
        />
      ),
    });

  return (
    <>
      <Grid columns={columns} rows={publications} />
      {allowAdd && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => editPublication(null)}
        >
          Add a New Publication
        </button>
      )}
      <PublicationEditModal {...modalProps} />
    </>
  );
}
