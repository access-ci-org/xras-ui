import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { filtersAtom, resetFiltersAtom, selectedFiltersAtom } from "./atoms";
import FilterCategory from "./FilterCategory";

const Filters = ({ onReset }: { onReset: () => void }) => {
  const filters = useAtomValue(filtersAtom);
  const selectedFilters = useAtomValue(selectedFiltersAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);

  return (
    <div className="bg-white text-left">
      <div className="grid grid-cols-12 gap-x-4">
        {filters.map((f) => (
          <FilterCategory selectedFilters={selectedFilters} category={f} key={f.categoryId} />
        ))}
      </div>
      <Button
        variant="outline"
        className="mb-2 mt-2"
        onClick={() => resetFilters()}
        disabled={selectedFilters.length == 0}
      >
        Reset Filters
      </Button>

      <Button variant="ghost" className="mb-2 ml-3 mt-2" onClick={onReset}>
        Close Menu
      </Button>
    </div>
  );
};

export default Filters;
