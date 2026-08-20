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
    /* Bootstrap's `.container-fluid > .row > .col-sm-3 / .col-sm-9`. The host
       app builds Bootstrap with a 1.25rem grid gutter, halved into the padding
       of each column and cancelled again by the row's negative margin, so the
       columns sit a full gutter apart but flush with the container's edges. */
    <div className="px-2.5">
      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 sm:w-1/4">
          <Filters />
        </div>
        <div className="w-full px-2.5 sm:w-3/4">
          <div className="-mx-2.5 flex flex-wrap">
            <div className="w-full px-2.5">
              <PublicationsList allowEdit={false} />
            </div>
          </div>
        </div>
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
