import { useSetAtom } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toggleFilterAtom } from "./atoms";
import type { Feature } from "./types";

const Filter = ({ filter, selectedFilters }: { filter: Feature; selectedFilters: number[] }) => {
  const toggleFilter = useSetAtom(toggleFilterAtom);
  const selected = selectedFilters.includes(filter.featureId);

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`filter_${filter.featureId}`}
        checked={selected}
        onCheckedChange={() => toggleFilter(filter.featureId)}
      />
      <Label htmlFor={`filter_${filter.featureId}`} className="font-normal">
        {filter.name}
      </Label>
    </div>
  );
};

export default Filter;
