import {useSelector, useDispatch} from "react-redux";
import {
  selectFilterOptions,
  selectFilterSelections,
  updateFilterSelection,
  getPublications,
  resetFilters
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

  const handleFilterChange = (e) => {
    dispatch(updateFilterSelection({ name: e.target.name, value: e.target.value }));
  };

  const handleSelection = (e) => {
    dispatch(updateFilterSelection({ name: e.target.name, value: e.target.value }));
  }

  return (
    <div className="row sticky-top mb-2">
      <div className="col">
        <h3 className="mb-2">Filters</h3>

        <h5 id="journals_filter_label" className="mb-1">
          Journals
        </h5>
        <div className="mb-3">
          <input
            placeholder="Type to search..."
            list="journal_list"
            name="journal"
            id="journal_select"
            value={filterSelections.journal}
            className="form-control"
            aria-labelledby="journal_filter_label"
            onChange={(e) => handleFilterChange(e)}
            onInput={(e) => handleSelection(e)}
          />

          <datalist id="journal_list">
            {filterOptions.journals.map((j, i) => (
              <option value={j} key={`journal_${i}`}>
                {j}
              </option>
            ))}
          </datalist>
        </div>

        <h5 id="author_name_label" className="mb-1">
          Author Name
        </h5>
        <div className="mb-3">
          <input
            placeholder="Last Name, First Initial"
            type="text"
            className="form-control"
            value={filterSelections.authorName}
            name="authorName"
            id="authorName"
            aria-labelledby="author_name"
            onChange={handleFilterChange}
          />
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

        <h5 id="publication_type_label" className="mb-1">
            Publication Type
        </h5>
        <div className="mb-3">
          <select
            name="publicationType"
            id="publication_type_select"
            value={filterSelections.publicationType}
            className="form-control"
            aria-labelledby="publication_type_label"
            onChange={(e) => handleFilterChange(e)}
          >
            <option value="">-- All --</option>
            {filterOptions.publication_types.map((a, i) => (
              <option value={a} key={`publication_type_${i}`}>
                {a}
              </option>
            ))}
          </select>
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