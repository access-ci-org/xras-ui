import Filter from "./Filter";

const FilterCategory = ({ category }) => {
  return (
    <div className="row">
      <div className="col">
        <div className="fw-bold mb-1 mt-1">
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
