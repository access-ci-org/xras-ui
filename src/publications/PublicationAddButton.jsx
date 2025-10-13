import { useDispatch } from "react-redux";
import { editPublication } from "./helpers/publicationEditSlice";

export default function PublicationAddButton() {
  const dispatch = useDispatch();

  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => dispatch(editPublication(null))}
    >
      Add a New Publication
    </button>
  );
}
