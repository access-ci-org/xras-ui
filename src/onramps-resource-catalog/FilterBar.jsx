import React, { useRef, useState } from "react";
import { useSelector } from "react-redux";
import Filters from "./Filters";
import styles from "./ResourceCatalog.module.scss";
import Nav from "./Nav";
import { selectSelectedFilters } from "./helpers/catalogSlice";

const FilterBar = () => {
  const [show, setShow] = useState(false);
  const menuRef = useRef(null);
  const selectedFilters = useSelector( selectSelectedFilters );

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

  const filterPillStyle = {
    color: "#fff",
    backgroundColor: "rgb(26, 91, 110)",
    marginLeft: "4px",
  }

  return (
    <div className={styles.filterBar} style={{ position: "sticky", top: "0px" }}>
      <div className={`row mb-2`}>
        <div className="col pt-2 pb-2">
          <div className="p-1 pb-0 bg-white">
            <div>
              <button className="btn mb-1 mt-1" style={{ border: "1px solid #48c0b9" }} type="button" onClick={toggleMenu}>
                <i className="bi bi-filter"></i> Filters
                { selectedFilters.length > 0 &&
                  <span
                    className="badge rounded-pill"
                    style={filterPillStyle}
                  >{selectedFilters.length}</span>
                }
              </button>
              <div className={`${styles.filtersHidden} pe-2 ps-2`} id="filtersList" ref={menuRef}>
                <Filters onReset={toggleMenu} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;