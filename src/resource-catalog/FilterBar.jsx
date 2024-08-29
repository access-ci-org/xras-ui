import React, { useState } from "react";
import Filters from "./Filters";
import { Offcanvas } from "react-bootstrap";

const FilterBar = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleOpen = () => setShow(true);

  return (
    <>
      <div className={`offcanvas offcanvas-start ${show ? 'show' : ''}`} tabindex="-1" id="offcanvas" aria-labelledby="offcanvasLabel">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasLabel">Filters</h5>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
            aria-label="Close"></button>
        </div>
        <div className="offcanvas-body">
          <Filters />
        </div>
      </div>
      <div className={`row mb-2`}>
        <div className="col pt-2 pb-2">
          <div className="p-1 pb-0 border-bottom bg-white shadow">
            <button className="btn btn-outline-primary mb-1 mt-1" type="button" onClick={handleOpen}>
              <i className="bi bi-filter"></i> Filters
            </button>
          </div>
        </div>
      </div>

    </>
  )
}

export default FilterBar;