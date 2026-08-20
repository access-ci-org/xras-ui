import { useAtomValue, useSetAtom } from "jotai";
import { filtersAtom, resetFiltersAtom, selectedFiltersAtom } from "./atoms";
import FilterCategory from "./FilterCategory";
import { BTN_OUTLINE_PRIMARY, BTN_WARNING, ROW } from "./catalogTheme";

const Filters = ({ onReset }: { onReset: () => void }) => {
  const filters = useAtomValue(filtersAtom);
  const selectedFilters = useAtomValue(selectedFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);

  return (
    <div className="bg-white text-left">
      <div className={ROW}>
        {filters.map((f) => (
          <FilterCategory
            selectedFilters={selectedFilters}
            category={f}
            key={f.categoryId}
          />
        ))}
      </div>
      <button
        type="button"
        className={`${BTN_WARNING} mb-2 mt-2`}
        onClick={() => resetFilters()}
        disabled={selectedFilters.length == 0}
      >
        Reset Filters
      </button>

      <button
        type="button"
        className={`${BTN_OUTLINE_PRIMARY} mb-2 ml-4 mt-2`}
        onClick={onReset}
      >
        Close Menu
      </button>
    </div>
  );
};

export default Filters;
