import { useDispatch, useSelector } from "react-redux";
import {
  getGrantNumber,
  grantSearch,
  setGrantNumber,
} from "./helpers/publicationEditSlice";

export default function ProjectSearch() {
  const dispatch = useDispatch();
  const grantNumber = useSelector(getGrantNumber);

  return (
    <div className={"row"}>
      <div className={"col"}>
        If your project isn't listed above, you can manually add it by entering
        the grant number below.
        <div className={"input-group mt-1"}>
          <input
            type={"text"}
            className={"form-control"}
            value={grantNumber}
            onChange={(e) => dispatch(setGrantNumber(e.target.value))}
            placeholder="Enter a grant number"
          />
          <button
            className={"btn btn-primary"}
            onClick={() => dispatch(grantSearch())}
          >
            Find Project
          </button>
        </div>
      </div>
    </div>
  );
}
