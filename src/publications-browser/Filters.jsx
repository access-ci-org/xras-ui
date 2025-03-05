import {useSelector, useDispatch} from "react-redux";
import {
  selectFilterOptions,
  selectFilterSelections,
  updateFilterSelection,
  getPublications,
  resetFilters,
  toggleJournal,
  toggleAllJournals
} from "./helpers/publicationsSlice.js";
import {setShowPagination, updatePageData} from "../projects-browser/helpers/browserSlice.js";
import {cleanDOI} from "./Publication.jsx";

const Filters = () => {
  const dispatch = useDispatch();
  const filterOptions = useSelector(selectFilterOptions);
  const filterSelections = useSelector(selectFilterSelections);

  const handleSubmit = () => {
    window.scrollTo(0, 0);
    dispatch(setShowPagination(false));
    dispatch(updatePageData({ current_page: 1 }))
    dispatch(getPublications());
  };

  const handleReset = () => {
    dispatch(resetFilters());
    window.scrollTo(0, 0);
    dispatch(getPublications());
  };

  if (!filterOptions.journals) {
    return <p>Loading filters...</p>;
  }

  const journalSelectListStyle = {
    height: "200px",
    overflowY: "auto",
    padding: "2px",
  }

  const handleFilterChange = (e) => {
    dispatch(updateFilterSelection({ name: e.target.name, value: e.target.value }));
  };

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
              checked={filterSelections.allJournalsToggled}
              onChange={() => {
                dispatch(toggleAllJournals());
              }}
            />
            <label className="form-check-label" htmlFor={`toggle_all`}>
              (Toggle All)
            </label>
          </div>
          {filterOptions.journals.map((journal) => (
              <div className="form-check" key={`journal_${journal}`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={journal}
                  id={`journal_${journal}`}
                  checked={filterSelections.journals.includes(journal)}
                  onChange={() => dispatch(toggleJournal(journal))}
                />
                <label
                  className="form-check-label"
                  htmlFor={`journal_${journal}`}
                >
                  {journal}
                </label>
              </div>
            )
          )}
        </div>

        <h5 id="doi_number_label" className="mb-1">
          DOI
        </h5>
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            value={cleanDOI(filterSelections.doi)}
            name="doi"
            id="doiNumber"
            aria-labelledby="doi_number_label"
            onChange={handleFilterChange}
          />
        </div>

        <div className="mt-2">
          <button className="btn btn-primary me-2" onClick={handleSubmit}>
            Submit
          </button>
          <button
            className="btn btn-secondary" onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;