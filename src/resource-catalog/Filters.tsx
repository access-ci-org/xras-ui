import { useAtomValue, useSetAtom } from "jotai";
import { filtersAtom, resetFiltersAtom } from "./atoms";
import { BTN_WARNING } from "./catalogTheme";
import FilterCategory from "./FilterCategory";

const Filters = () => {
  const filters = useAtomValue(filtersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const selected = filters.filter((f) => f.features.some((fl) => fl.selected));

  return (
    <div>
      <h4 className="mb-0!">Filters</h4>
      {filters.map((f) => (
        <FilterCategory category={f} key={f.categoryId} />
      ))}
      <button
        type="button"
        className={`${BTN_WARNING} my-2`}
        onClick={() => resetFilters()}
        disabled={selected.length == 0}
      >
        Reset Filters
      </button>
    </div>
  );
};

export default Filters;
