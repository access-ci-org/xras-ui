import Filter from "./Filter";
import { COL, ROW } from "./catalogTheme";
import type { FilterCategoryType } from "./types";

const FilterCategory = ({ category }: { category: FilterCategoryType }) => {
  return (
    <div className={ROW}>
      <div className={COL}>
        <div className="mb-1 mt-1 font-bold">
          <abbr title={category.categoryDescription}>
            {category.categoryName}
          </abbr>
        </div>
        {category.features.map((f) => (
          <Filter filter={f} key={f.featureId} />
        ))}
      </div>
    </div>
  );
};

export default FilterCategory;
