import Filter from "./Filter";
import type { FilterCategoryType } from "./types";

const FilterCategory = ({
  category,
  selectedFilters,
}: {
  category: FilterCategoryType;
  selectedFilters: number[];
}) => {
  return (
    <div className="col-span-12 sm:col-span-6">
      <div className="mb-1 mt-1 font-bold">
        <abbr title={category.categoryDescription}>{category.categoryName}</abbr>
      </div>
      {category.features.map((f) => (
        <Filter filter={f} key={f.featureId} selectedFilters={selectedFilters} />
      ))}
    </div>
  );
};

export default FilterCategory;
