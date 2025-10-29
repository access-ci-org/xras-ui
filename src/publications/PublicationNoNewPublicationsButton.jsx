import {dismissNotice} from "../projects/helpers/apiSlice.js";
import {useDispatch} from "react-redux";

export default function PublicationNoNewPublicationsButton() {
    const dispatch = useDispatch();

    return (
        <button
            type="button"
            className="btn btn-primary"
            onClick={() => dispatch(dismissNotice())}
        >
            I have no new publications to report
        </button>
    );
}
