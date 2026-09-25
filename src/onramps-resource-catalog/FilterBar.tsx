import { useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Filter as FilterIcon } from "lucide-react";
import Filters from "./Filters";
import styles from "./ResourceCatalog.module.scss";
import { BADGE, BADGE_PILL, BTN_DEFAULT, ICON } from "./catalogTheme";
import { selectedFiltersAtom } from "./atoms";

const FilterBar = () => {
  const [show, setShow] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedFilters = useAtomValue(selectedFiltersAtom);

  const toggleMenu = () => {
    const menu = menuRef.current;
    if (!menu) return;

    if (!show) {
      menu.style.height = `${menu.scrollHeight}px`;
      menu.classList.remove(styles.filtersHidden);
      menu.classList.add(styles.filtersVisible);
    } else {
      menu.style.height = "0px";
      menu.classList.remove(styles.filtersVisible);
      menu.classList.add(styles.filtersHidden);
    }

    setShow(!show);
  };

  return (
    <div
      className={styles.filterBar}
      style={{ position: "sticky", top: "0px" }}
    >
      <div className="mb-2 py-2">
        <div className="bg-white p-1 pb-0">
          <div>
            <button
              className={`${BTN_DEFAULT} mb-1 mt-1`}
              style={{ borderColor: "#48c0b9" }}
              type="button"
              onClick={toggleMenu}
            >
              <FilterIcon className={ICON} /> Filters
              {selectedFilters.length > 0 && (
                <span
                  className={`${BADGE} ${BADGE_PILL} ml-1 text-white`}
                  style={{ backgroundColor: "rgb(26, 91, 110)" }}
                >
                  {selectedFilters.length}
                </span>
              )}
            </button>
            <div
              className={`${styles.filtersHidden} px-2`}
              id="filtersList"
              ref={menuRef}
            >
              <Filters onReset={toggleMenu} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
