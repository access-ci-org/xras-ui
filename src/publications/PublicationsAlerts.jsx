import { useDispatch, useSelector } from "react-redux";
import {
  getErrors,
  getShowSaved,
  hideError,
  updateShowSaved,
} from "./helpers/publicationEditSlice";

export default function PublicationsAlerts() {
  const dispatch = useDispatch();
  const errors = useSelector(getErrors);
  const showSaved = useSelector(getShowSaved);

  return (
    <>
      {showSaved && (
        <div className={"alert alert-success alert-dismissible sticky-top"}>
          Publication Saved Successfully!
          <button
            type={"button"}
            className={"btn-close"}
            aria-label={"Close"}
            onClick={() => dispatch(updateShowSaved(false))}
          ></button>
        </div>
      )}
      {errors.map((err) => (
        <div
          key={`err_${err.id}`}
          className={"alert alert-danger alert-dismissible sticky-top"}
        >
          {err.message}
          <button
            type={"button"}
            className={"btn-close"}
            aria-label={"Close"}
            onClick={() => dispatch(hideError(err.id))}
          ></button>
        </div>
      ))}
    </>
  );
}
