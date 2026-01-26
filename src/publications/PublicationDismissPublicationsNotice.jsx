import {useDispatch, useSelector} from "react-redux";
import {dismissNotice} from "../projects/helpers/apiSlice.js";

export default function PublicationDismissPublicationsNotice() {
    const dispatch = useDispatch();
    const showUpdatePublications = useSelector(
        (state) => state.dismissPublicationNotice.showUpdatePublications
    );
    if (!showUpdatePublications) return null;
    return (
        <button
            type="button"
            className="btn btn-primary"
            onClick={(e) => {
                dispatch(dismissNotice());
                e.currentTarget.blur(); // removes focus
            }}
        >
            I Have No NEW PUBLICATIONS
        </button>
    );
}
