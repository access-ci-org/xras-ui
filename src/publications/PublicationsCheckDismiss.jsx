import {dismissNotice} from "../projects/helpers/apiSlice.js";
import {useDispatch} from "react-redux";

export default function PublicationsCheckDismiss({ grantNumber }) {
    const dispatch = useDispatch();

    return (
        <button
            type="button"
            className="btn btn-primary"
            onClick={(e) => {
                dispatch(dismissNotice(grantNumber));
                e.currentTarget.blur(); // removes focus
            }}
        >
            I Have No NEW PUBLICATIONS
        </button>
    );
}
