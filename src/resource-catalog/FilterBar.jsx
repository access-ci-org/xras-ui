import React, { useState } from "react";
import Filters from "./Filters";
import { Offcanvas } from "react-bootstrap";

const FilterBar = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleOpen = () => setShow(true);

  return (
    <>
      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Filters />
        </Offcanvas.Body>
      </Offcanvas>
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