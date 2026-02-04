import {useDispatch, useSelector} from "react-redux";
import {
    dismissNotice,
    selectShowUpdatePublications,
} from "../projects/helpers/apiSlice";

export default function PublicationDismissPublicationsNotice() {
    const dispatch = useDispatch();
    const showUpdatePublications = useSelector(selectShowUpdatePublications);
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
            I HAVE NO NEW PUBLICATIONS
        </button>
    );
}
