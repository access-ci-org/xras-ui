import React from "react";
import { useDispatch } from "react-redux";
import { catalogFilter } from "./helpers/catalogSlice";

const CatalogList = ({ catalogs }) => {
  const dispatch = useDispatch();

  const handleChange = (e, catalog) => {
    dispatch( catalogFilter({ selected: e.target.checked, catalog }) );
  }

  return (
    <div className="row">
      <div className="col">
        <div className="fw-bold mb-1 mt-1">
          Catalogs
        </div>
        {catalogs.map((catalog) => (
          <div className="row" key={`catalog_${catalog.catalogId}`}>
            <div className="col">
              <div className="form-check">
                <label
                  className="form-check-label"
                  htmlFor={`catalog_${catalog.catalogId}`}
                >
                  {catalog.catalogLabel}
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={catalog.catalogId}
                  id={`catalog_${catalog.catalogId}`}
                  checked={catalog.selected}
                  onChange={() => handleChange(event, catalog)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CatalogList;