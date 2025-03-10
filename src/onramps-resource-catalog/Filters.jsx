import { useSelector, useDispatch } from "react-redux";
import { resetFilters, selectFilters, selectCatalogs } from "./helpers/catalogSlice";
import FilterCategory from "./FilterCategory";
import CatalogList from "./CatalogList";

const Filters = ({ onReset }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector( selectCatalogs );
  const filters = useSelector( selectFilters );
  const selected = filters.filter(
    (f) => f.features.filter((fl) => fl.selected).length > 0
  );

  const catalogFilters = Object.keys(catalogs).map((c) => catalogs[c]);

  return (
    <>
      {/* {catalogFilters.length > 0 ? <CatalogList catalogs={catalogFilters} /> : ''} */}
      {filters.map((f) => (
        <FilterCategory category={f} key={f.categoryId} />
      ))}
      <button
        className="btn btn-warning mt-2 mb-2"
        onClick={() => dispatch(resetFilters())}
        disabled={selected.length == 0}
      >
        Reset Filters
      </button>

      <button
        className="btn btn-outline-primary ms-3 mt-2 mb-2"
        onClick={onReset}
      >
        Close Menu
      </button>
    </>
  );
};

export default Filters;
