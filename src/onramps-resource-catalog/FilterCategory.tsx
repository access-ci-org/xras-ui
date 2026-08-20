import Filter from "./Filter";
import { COL } from "./catalogTheme";
import type { FilterCategoryType } from "./types";

const FilterCategory = ({
  category,
  selectedFilters,
}: {
  category: FilterCategoryType;
  selectedFilters: number[];
}) => {
  return (
    <div className={`${COL} min-[576px]:w-1/2`}>
      <div className="mb-1 mt-1 font-bold">
        <abbr title={category.categoryDescription}>
          {category.categoryName}
        </abbr>
      </div>
      {category.features.map((f) => (
        <Filter
          filter={f}
          key={f.featureId}
          selectedFilters={selectedFilters}
        />
      ))}
    </div>
  );
};

export default FilterCategory;
