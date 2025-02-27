import {useSelector} from "react-redux";
import {selectFilters} from "./helpers/publicationsSlice.js"

const Filters = () => {
  const filterOptions = useSelector(selectFilters);

  if (!filterOptions.journals) {
    return <p>Loading filters...</p>;
  }

  const journalSelectListStyle = {
    height: "200px",
    overflowY: "auto",
    padding: "2px",
  }

  return (
    <div className="row sticky-top mb-2">
      <div className="col">
        <h3 className="mb-2">Filters</h3>
        <h5 className="mb-1">Journal</h5>
        <div className={`border mb-3`} style={journalSelectListStyle}>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              id="toggle_all"
              // checked={filters.allFosToggled}
              onChange={() => {
                // dispatch(toggleAllFos());
              }}
            />
            <label className="form-check-label" htmlFor={`toggle_all`}>
              (Toggle All)
            </label>
          </div>
          {filterOptions.journals.map((journal) => (
              <div className="form-check" key={`fos_${journal}`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={journal}
                  id={`fos_${journal}`}
                  // checked={fos.checked}
                  // onChange={() => dispatch(toggleFos(fos))}
                />
                <label
                  className="form-check-label"
                  htmlFor={`fos_${journal}`}
                >
                  {journal}
                </label>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Filters;