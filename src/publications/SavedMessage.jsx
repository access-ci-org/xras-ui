import { useDispatch, useSelector } from "react-redux";
import { getShowSaved, updateShowSaved } from "./helpers/publicationEditSlice";

export default function SavedMessage() {
  const dispatch = useDispatch();
  const showSaved = useSelector(getShowSaved);

  if (showSaved)
    return (
      <div className={"alert alert-success alert-dismissible sticky-top"}>
        Publication Saved Successfully!
        <button
          type={"button"}
          className={"btn-close"}
          aria-label={"Close"}
          onClick={() => dispatch(updateShowSaved(false))}
        ></button>
      </div>
    );
}
