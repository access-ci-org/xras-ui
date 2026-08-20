import { useSetAtom } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleFilterAtom } from "./atoms";
import { FORM_CHECK, FORM_CHECK_INPUT, FORM_CHECK_LABEL } from "./catalogTheme";
import type { Feature } from "./types";

const Filter = ({
  filter,
  selectedFilters,
}: {
  filter: Feature;
  selectedFilters: number[];
}) => {
  const toggleFilter = useSetAtom(toggleFilterAtom);
  const selected = selectedFilters.includes(filter.featureId);

  return (
    <div className={FORM_CHECK}>
      <Checkbox
        className={FORM_CHECK_INPUT}
        id={`filter_${filter.featureId}`}
        checked={selected}
        onCheckedChange={() => toggleFilter(filter.featureId)}
      />
      <label
        className={FORM_CHECK_LABEL}
        htmlFor={`filter_${filter.featureId}`}
      >
        {filter.name}
      </label>
    </div>
  );
};

export default Filter;
