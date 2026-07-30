import { useEffect, useMemo } from "react";
import { Provider, createStore, useSetAtom } from "jotai";
import Filters from "./Filters";
import PublicationsList from "./PublicationsList";
import { getFiltersAtom, getPublicationsAtom } from "./atoms";

function PublicationsBrowserInner() {
  const getPublications = useSetAtom(getPublicationsAtom);
  const getFilters = useSetAtom(getFiltersAtom);

  useEffect(() => {
    getPublications();
    getFilters();
  }, []);

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="sm:w-1/4">
        <Filters />
      </div>
      <div className="sm:w-3/4">
        <PublicationsList allowEdit={false} />
      </div>
    </div>
  );
}

export default function PublicationsBrowser() {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <PublicationsBrowserInner />
    </Provider>
  );
}
