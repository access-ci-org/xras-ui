import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getSaving, getShowSaved } from "./helpers/publicationEditSlice";
import useEditPublication from "./hooks/useEditPublication";
import config from "../shared/helpers/config";

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
  const saving = useSelector(getSaving);
  const showSaved = useSelector(getShowSaved);
  const { editPublication, ...modalProps } = useEditPublication();

  const [authors, _setAuthors] = useState(usernames);
  const [selected, setSelected] = useState(selectedPublicationIds);
  const [publications, setPublications] = useState([]);

  // We need to use a ref so that event listeners can access the latest
  // value of authors. See:
  // https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
  const authorsRef = useRef(authors);
  const setAuthors = (values) => {
    authorsRef.current = values;
    _setAuthors(values);
  };

  const updatePublications = async () => {
    const res = await fetch(
      config.routes.search_publications_path({
        created_by: authors,
        per_page: 9999,
      }),
      { headers: { Accept: "application/json" } },
    );
    const data = await res.json();
    setPublications(
      data.publications.sort((a, b) =>
        new Date(a.publication_year, b.publication_month - 1) >
        new Date(b.publication_year, b.publication_month - 1)
          ? -1
          : 1,
      ),
    );
  };

  // Fetch a new list of publications when the author usernames change.
  useEffect(() => {
    updatePublications();
  }, [authors]);

  // Fetch a new list of publications when a publication is added or edited.
  useEffect(() => {
    if (!saving && showSaved) updatePublications();
  }, [saving, showSaved]);

  // Attach event listeners to detect when users are added to
  // or removed from the request.
  useEffect(() => {
    addEventListener("requestAddRole", (e) =>
      setAuthors([...authorsRef.current, e.detail.username]),
    );
    addEventListener("requestRemoveRole", (e) =>
      setAuthors(authorsRef.current.filter((a) => a != e.detail.username)),
    );
  }, []);

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
            onChange={() =>
              setSelected(
                isSelected
                  ? selected.filter((s) => s != value)
                  : [...selected, value],
              )
            }
          />
        );
      },
      formatHeader: () => (
        <MultiStateCheckbox
          selectedLength={selected.length}
          totalLength={publications.length}
          onChange={(checked) =>
            setSelected(
              checked ? publications.map((pub) => pub.publication_id) : [],
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
