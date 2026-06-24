import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { filtersAtom, resetFiltersAtom } from "./atoms";
import FilterCategory from "./FilterCategory";

const Filters = () => {
  const filters = useAtomValue(filtersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const selected = filters.filter((f) => f.features.some((fl) => fl.selected));

  return (
    <div>
      <h4 className="mb-0">Filters</h4>
      {filters.map((f) => (
        <FilterCategory category={f} key={f.categoryId} />
      ))}
      <Button
        variant="outline"
        className="mb-2 mt-2"
        onClick={() => resetFilters()}
        disabled={selected.length == 0}
      >
        Reset Filters
      </Button>
    </div>
  );
};

export default Filters;
