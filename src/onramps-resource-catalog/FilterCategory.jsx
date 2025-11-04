import Filter from "./Filter";

const FilterCategory = ({ category, selectedFilters }) => {
  return (

    <div className="col-12 col-sm-6">
      <div className="fw-bold mb-1 mt-1">
        <abbr title={category.categoryDescription}>
          {category.categoryName}
        </abbr>
      </div>
      {category.features.map((f) => (
        <Filter filter={f} key={f.featureId} selectedFilters={selectedFilters} />
      ))}
    </div>
  );
};

export default FilterCategory;
