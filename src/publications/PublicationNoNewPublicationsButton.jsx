import {dismissNotice} from "../projects/helpers/apiSlice.js";
import {useDispatch} from "react-redux";

export default function PublicationNoNewPublicationsButton() {
    const dispatch = useDispatch();

    return (
        <button
            type="button"
            className="btn btn-primary"
            onClick={(e) => {
                dispatch(dismissNotice());
                e.currentTarget.blur(); // removes focus
            }}
        >
            no new publications
        </button>
    );
}
