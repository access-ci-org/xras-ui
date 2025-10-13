import { connect } from "react-redux";
import { updateAuthor, deleteAuthor } from "./helpers/publicationEditSlice";

const Author = ({ author, authorKey, updateAuthor, deleteAuthor }) => {
  const updateField = (e) => {
    updateAuthor({ key: e.target.name, value: e.target.value, idx: authorKey });
  };

  const field = (key) => {
    return (
      <td key={`field_${key}`}>
        <input
          type={"text"}
          className={"form-control"}
          name={key}
          id={key}
          value={author[key]}
          onChange={(e) => updateField(e)}
        />
      </td>
    );
  };

  const fields = ["first_name", "last_name", "affiliation"];

  return (
    <tr>
      {fields.map((f) => field(f))}
      <td>
        {authorKey !== 0 && (
          <button
            className={"btn btn-sm btn-danger"}
            onClick={() => deleteAuthor(authorKey)}
          >
            <i className={"bi bi-trash"}></i>
          </button>
        )}
      </td>
    </tr>
  );
};

const mapDispatchToProps = (dispatch) => ({
  updateAuthor: (data) => dispatch(updateAuthor(data)),
  deleteAuthor: (data) => dispatch(deleteAuthor(data)),
});

export default connect(null, mapDispatchToProps)(Author);
