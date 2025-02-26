import { useEffect, useRef, useState } from "react";
import AddPublication from "./AddPublication";
import config from "../shared/helpers/config";

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
      config.routes.search_publications_path({ usernames: authors })
    );
    const pubs = await res.json();
    setPublications(pubs);
  };

  // Fetch a new list of publications when the author usernames change.
  useEffect(() => {
    updatePublications();
  }, [authors]);

  // Attach event listeners to detect when users are added to
  // or removed from the request.
  useEffect(() => {
    addEventListener("requestAddRole", (e) =>
      setAuthors([...authorsRef.current, e.detail.username])
    );
    addEventListener("requestRemoveRole", (e) =>
      setAuthors(authorsRef.current.filter((a) => a != e.detail.username))
    );
  }, []);

  // Format table rows.
  let hasSelected = false;
  let hasUnselected = false;
  const rows = publications.map((pub) => {
    const isSelected = selected.includes(pub.publication_id);
    hasSelected = hasSelected || isSelected;
    hasUnselected = hasUnselected || !isSelected;
    const pubDate = new Date(pub.publication_year, pub.publication_month - 1);
    return (
      <tr key={pub.publication_id}>
        <td>
          <input
            type="checkbox"
            name="publication_ids[]"
            value={pub.publication_id}
            checked={isSelected}
            onChange={() =>
              setSelected(
                isSelected
                  ? selected.filter((s) => s != pub.publication_id)
                  : [...selected, pub.publication_id]
              )
            }
          />
        </td>
        <td>{pub.title}</td>
        <td>
          {pub.authors
            .map((author) => `${author.first_name} ${author.last_name}`)
            .join(", ")}
        </td>
        <td>{pub.publication_type}</td>
        <td>
          {pubDate.toLocaleString("default", { month: "short" })}{" "}
          {pub.publication_year}
        </td>
      </tr>
    );
  });

  const checkboxLabel = `${hasUnselected ? "Select" : "Deselect"} all`;

  return (
    <div className="publications-select">
      <table className="table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                value=""
                aria-label={checkboxLabel}
                title={checkboxLabel}
                checked={hasSelected && !hasUnselected}
                onChange={() =>
                  setSelected(
                    hasUnselected
                      ? publications.map((pub) => pub.publication_id)
                      : []
                  )
                }
                ref={(el) => {
                  if (el) {
                    el.indeterminate = hasSelected && hasUnselected;
                  }
                }}
              />
            </th>
            <th>Title</th>
            <th>Authors</th>
            <th>Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <AddPublication updatePublications={updatePublications} />
    </div>
  );
};

export default PublicationsSelect;
