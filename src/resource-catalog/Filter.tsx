import { useSetAtom } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleFilterAtom } from "./atoms";
import {
  COL,
  FORM_CHECK,
  FORM_CHECK_INPUT,
  FORM_CHECK_LABEL,
  ROW,
} from "./catalogTheme";
import type { Feature } from "./types";

const Filter = ({ filter }: { filter: Feature }) => {
  const toggleFilter = useSetAtom(toggleFilterAtom);

  return (
    <div className={ROW}>
      <div className={COL}>
        <div className={FORM_CHECK}>
          <Checkbox
            className={FORM_CHECK_INPUT}
            id={`filter_${filter.featureId}`}
            checked={filter.selected}
            onCheckedChange={() => toggleFilter(filter)}
          />
          <label
            className={FORM_CHECK_LABEL}
            htmlFor={`filter_${filter.featureId}`}
          >
            {filter.name}
          </label>
        </div>
      </div>
    </div>
  );
};

export default Filter;
