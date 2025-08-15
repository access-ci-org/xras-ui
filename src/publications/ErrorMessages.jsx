import { useDispatch, useSelector } from "react-redux";
import { getErrors, hideError } from "./helpers/publicationEditSlice";

export default function ErrorMessages() {
  const dispatch = useDispatch();
  const errors = useSelector(getErrors);
  return (
    <>
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
