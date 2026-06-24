import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import { getResourcesAtom, hasErrorsAtom, resourcesLoadedAtom } from "./atoms";
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

  if (hasErrors) {
    return (
      <div className="mt-2 text-center">
        <h4>Unable to Load Resources</h4>
      </div>
    );
  }

  if (!resourcesLoaded) {
    return (
      <div
        role="status"
        className="size-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-6 sm:flex-row">
      <div className="sm:w-1/3">
        <Filters />
      </div>
      <div className="sm:w-2/3">
        <ResourceList />
      </div>
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
