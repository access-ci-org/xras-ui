import { useDispatch, useSelector } from "react-redux";
import {
  doiLookup,
  getDoi,
  updatePublication,
} from "./helpers/publicationEditSlice";

export default function DoiSearch() {
  const dispatch = useDispatch();
  const doi = useSelector(getDoi);
  return (
    <div className={"row mb-3"}>
      <div className={"col"}>
        <label htmlFor={"doi"} className={"form-label"}>
          DOI
        </label>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            id="doi"
            name={"publication[doi]"}
            aria-label="DOI Input and Search box"
            aria-describedby="doi_button"
            value={doi}
            onChange={(el) =>
              dispatch(
                updatePublication({ key: "doi", value: el.target.value }),
              )
            }
          />
          <button
            className="btn btn-primary"
            type="button"
            id="doi_button"
            onClick={() => dispatch(doiLookup())}
          >
            Lookup Publication
          </button>
        </div>
      </div>
    </div>
  );
}
