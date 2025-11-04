import { useDispatch } from "react-redux";
import { toggleFilter } from "./helpers/catalogSlice";

const Filter = ({ filter, selectedFilters }) => {
  const dispatch = useDispatch();
  const handleChange = () => {
    dispatch(toggleFilter(filter.featureId));
  };

  const selected = selectedFilters.includes(filter.featureId);

  return (
    <div className="row">
      <div className="col">
        <div className="form-check">
          <label
            className="form-check-label"
            htmlFor={`filter_${filter.featureId}`}
          >
            {filter.name}
          </label>
          <input
            className="form-check-input"
            type="checkbox"
            value={filter.featureId}
            id={`filter_${filter.featureId}`}
            checked={selected}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Filter;
