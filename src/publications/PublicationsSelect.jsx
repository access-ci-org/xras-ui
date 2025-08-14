import { useEffect, useRef, useState } from "react";
import config from "../shared/helpers/config";

import AddPublication from "./AddPublication";
import Grid from "../shared/Grid";
import MultiStateCheckbox from "../shared/MultiStateCheckbox";
import PublicationCitation from "../publications-browser/PublicationCitation";

const PublicationsSelect = ({ usernames = [], publication_ids = [] }) => {
  const [authors, _setAuthors] = useState(usernames);
  const [selected, setSelected] = useState(publication_ids);
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
    },
    {
      key: "publication",
      name: "Publication",
      format: (_value, row) => <PublicationCitation publication={row} />,
    },
    {
      key: "created_by",
      name: "Entered By",
    },
  ];

  return (
    <div className="publications-select">
      <Grid columns={columns} rows={publications} />
      <AddPublication updatePublications={updatePublications} />
    </div>
  );
};

export default PublicationsSelect;
