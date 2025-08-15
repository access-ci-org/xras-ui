import { useDispatch, useSelector } from "react-redux";
import {
  addAuthor,
  getAuthors,
  getAuthorsExist,
} from "./helpers/publicationEditSlice";

import Author from "./Author";

export default function Authors() {
  const dispatch = useDispatch();
  const authors = useSelector(getAuthors);
  const authorsExist = useSelector(getAuthorsExist);

  const noAuthors = authors.length === 0;
  const showError = () => {
    return authorsExist ? (
      ""
    ) : (
      <div className={"alert alert-danger"}>
        You must add at least one author and each author must have a first and
        last name
      </div>
    );
  };

  return (
    <div>
      {showError()}
      <table className={"table"}>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Affiliation</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {authors.map((a, i) => (
            <Author author={a} authorKey={i} key={`author_${i}`} />
          ))}
          {noAuthors && <Author author={dispatch(addAuthor())} />}
        </tbody>
      </table>
      <button
        className={"btn btn-primary mt-3"}
        onClick={() => dispatch(addAuthor())}
      >
        Add Author
      </button>
    </div>
  );
}
