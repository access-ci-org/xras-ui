import React, { useRef, useState } from "react";
import Filters from "./Filters";
import styles from "./ResourceCatalog.module.scss";

const FilterBar = () => {
  const [show, setShow] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    const menu = menuRef.current
    if(!show){
      menu.style.height = menu.scrollHeight + "px";
      menu.classList.remove(styles.filtersHidden);
      menu.classList.add(styles.filtersVisible);
    } else {
      menu.style.height = '0px';
      menu.classList.remove(styles.filtersVisible);
      menu.classList.add(styles.filtersHidden);
    }

    setShow(!show);

  }

  return (
    <div className={styles.filterBar}>
      <div className={`row mb-2`}>
        <div className="col pt-2 pb-2">
          <div className="p-1 pb-0 border-bottom bg-white shadow">
            <div className="d-flex justify-content-between">
              <ul class="nav nav-underline">
                <li class="nav-item">
                  <a class="nav-link active" aria-current="page" href="#">Active</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#">Link</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#">Link</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link disabled" aria-disabled="true">Disabled</a>
                </li>
              </ul>
              <div style={{ textAlign: "right" }}>
                <button className="btn btn-outline-primary mb-1 mt-1" type="button" onClick={toggleMenu}>
                  <i className="bi bi-filter"></i> Filters
                </button>
                <div className={`${styles.filtersHidden} pe-2 ps-2`} id="filtersList" ref={menuRef}>
                  <Filters onReset={toggleMenu} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;