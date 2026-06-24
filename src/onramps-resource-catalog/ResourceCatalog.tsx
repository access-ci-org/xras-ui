import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import AccessHeader from "./AccessHeader";
import ResourceList from "./ResourceList";
import { catalogsAtom, hasErrorsAtom, initAppAtom, resourcesLoadedAtom } from "./atoms";
import type { ResourceCatalogProps } from "./types";

function ResourceCatalogInner({ onRamps = false, baseUrl }: ResourceCatalogProps) {
  const resourcesLoaded = useAtomValue(resourcesLoadedAtom);
  const hasErrors = useAtomValue(hasErrorsAtom);
  const stateCatalogs = useAtomValue(catalogsAtom);
  const catalogs = Object.values(stateCatalogs);
  const initApp = useSetAtom(initAppAtom);

  useEffect(() => {
    initApp();
  }, []);

  const renderCatalogDescriptions = () => {
    if (onRamps && catalogs.length > 1) {
      return (
        <>
          {catalogs
            .filter((c) => c.catalogLabel != "ACCESS")
            .map((c, i) => (
              <div className="mb-3" key={`catalog_${i}`}>
                <h4 className="border-b">About {c.catalogLabel}</h4>
                <div dangerouslySetInnerHTML={{ __html: c.description ?? "" }}></div>
              </div>
            ))}
        </>
      );
    }

    return "";
  };

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
    <div className="mt-3" style={{ fontFamily: "Archivo, sans-serif" }}>
      {onRamps ? <AccessHeader baseUrl={baseUrl} /> : ""}
      {renderCatalogDescriptions()}
      <ResourceList />
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
