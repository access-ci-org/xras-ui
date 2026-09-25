import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import AccessHeader from "./AccessHeader";
import ResourceList from "./ResourceList";
import bs from "@/shared/bootstrap5.module.scss";
import { apiUrlAtom, defaultApiUrl, hasErrorsAtom, initAppAtom, resourcesLoadedAtom } from "./atoms";
import type { ResourceCatalogProps } from "./types";

function ResourceCatalogInner({
  onRamps = false,
  baseUrl,
  apiUrl = defaultApiUrl,
}: ResourceCatalogProps) {
  // Hydrate before the mount effect below fires, so the first fetch already
  // sees the caller's API base.
  useHydrateAtoms([[apiUrlAtom, apiUrl]]);

  const resourcesLoaded = useAtomValue(resourcesLoadedAtom);
  const hasErrors = useAtomValue(hasErrorsAtom);
  const initApp = useSetAtom(initAppAtom);

  useEffect(() => {
    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        className="inline-block size-8 animate-spin rounded-full border-4 border-current border-r-transparent align-[-0.125em] [animation-duration:0.75s]"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    /*
     * `.container`, less the max-widths: the on-ramps page's content column is
     * narrower than the max-width for its breakpoint at every width, so they
     * never bound the catalog.
     */
    <div className={`${bs.reboot} mx-auto mt-4 w-full px-3`}>
      {onRamps ? <AccessHeader baseUrl={baseUrl} /> : ""}
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
