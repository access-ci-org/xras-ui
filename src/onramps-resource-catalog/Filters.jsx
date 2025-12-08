import { useSelector, useDispatch } from "react-redux";
import { resetFilters, selectFilters, selectCatalogs, selectSelectedFilters } from "./helpers/catalogSlice";
import FilterCategory from "./FilterCategory";
import CatalogList from "./CatalogList";

const Filters = ({ onReset }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector( selectCatalogs );
  const filters = useSelector( selectFilters );
  const selectedFilters = useSelector( selectSelectedFilters );

  const catalogFilters = Object.keys(catalogs).map((c) => catalogs[c]);

  return (
    <div style={{ textAlign: "left", backgroundColor: "#fff" }}>
      {/* {catalogFilters.length > 0 ? <CatalogList catalogs={catalogFilters} /> : ''} */}
      {filters.map((f) => (
        <FilterCategory selectedFilters={selectedFilters} category={f} key={f.categoryId} />
      ))}
      <button
        className="btn btn-warning mt-2 mb-2"
        onClick={() => dispatch(resetFilters())}
        disabled={selectedFilters.length == 0}
      >
        Reset Filters
      </button>

      <button
        className="btn btn-outline-primary ms-3 mt-2 mb-2"
        onClick={onReset}
      >
        Close Menu
      </button>
    </div>
  );
};

export default Filters;
