import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import bs from "@/shared/bootstrap5.module.scss";
import styles from "./ResourceCatalog.module.scss";
import { getResourcesAtom, hasErrorsAtom, resourcesLoadedAtom } from "./atoms";
import { COL, HOST_FONT, ROW, SPINNER } from "./catalogTheme";
import ResourceList from "./ResourceList";
import Filters from "./Filters";
import type { ResourceCatalogProps } from "./types";

function ResourceCatalogInner({
  apiUrl,
  excludedCategories = [],
  excludedFilters = [],
  excludedResources = [],
  allowedCategories = [],
  allowedFilters = [],
}: ResourceCatalogProps) {
  const resourcesLoaded = useAtomValue(resourcesLoadedAtom);
  const hasErrors = useAtomValue(hasErrorsAtom);
  const getResources = useSetAtom(getResourcesAtom);

  useEffect(() => {
    getResources({
      apiUrl,
      excludedCategories,
      excludedFilters,
      excludedResources,
      allowedCategories,
      allowedFilters,
    });
  }, []);

  const renderCatalog = () => {
    if (hasErrors) {
      return (
        <div className={ROW}>
          <div className={`${COL} mt-2 text-center`}>
            <h4>Unable to Load Resources</h4>
          </div>
        </div>
      );
    }

    if (!resourcesLoaded) {
      return (
        <div role="status" className={SPINNER}>
          <span className="sr-only">Loading...</span>
        </div>
      );
    }

    return (
      <div className={`${ROW} mt-4`}>
        <div className={`${COL} min-[576px]:w-1/3`}>
          <Filters />
        </div>
        <div className={`${COL} min-[576px]:w-2/3`}>
          <ResourceList />
        </div>
      </div>
    );
  };

  /*
   * The catalog used to render in the page rather than in a shadow root, in the
   * host app's font and over its stock Bootstrap.
   */
  return (
    <div className={`${bs.reboot} ${styles.catalog} ${HOST_FONT}`}>
      {renderCatalog()}
    </div>
  );
}

export default function ResourceCatalog(props: ResourceCatalogProps) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <ResourceCatalogInner {...props} />
    </Provider>
  );
}
