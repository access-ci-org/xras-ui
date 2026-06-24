import { useSetAtom } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toggleFilterAtom } from "./atoms";
import type { Feature } from "./types";

const Filter = ({ filter }: { filter: Feature }) => {
  const toggleFilter = useSetAtom(toggleFilterAtom);

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`filter_${filter.featureId}`}
        checked={filter.selected}
        onCheckedChange={() => toggleFilter(filter)}
      />
      <Label htmlFor={`filter_${filter.featureId}`} className="font-normal">
        {filter.name}
      </Label>
    </div>
  );
};

export default Filter;
