import { useEffect, useMemo } from "react";
import { Provider, createStore, useSetAtom, useAtomValue, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import Filters from "./Filters";
import ProjectList from "./ProjectList";
import Pagination from "./Pagination";
import {
  apiUrlAtom,
  filtersLoadedAtom,
  initAppAtom,
  projectsLoadedAtom,
  showPaginationAtom,
} from "./atoms";

function HydrateAtoms({
  values,
  children,
}: {
  values: Map<WritableAtom<any, any[], any>, unknown>;
  children: React.ReactNode;
}) {
  useHydrateAtoms(values);
  return <>{children}</>;
}

function ProjectsBrowserInner() {
  const initApp = useSetAtom(initAppAtom);
  const projectsLoaded = useAtomValue(projectsLoadedAtom);
  const filtersLoaded = useAtomValue(filtersLoadedAtom);
  const showPagination = useAtomValue(showPaginationAtom);

  useEffect(() => {
    // The only place the query string is read. `initAppAtom` takes it as an
    // argument, so this component is the app's single edge onto the URL.
    void initApp(window.location.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* Bootstrap's `.container-fluid > .row > .col-sm-3 / .col-sm-9`: the grid
       gutter (1.25rem in this app's build) halved into each column's padding and
       cancelled by the row's negative margin. */
    <div className="px-2.5">
      <div className="-mx-2.5 flex flex-wrap">
        <div className="w-full px-2.5 sm:w-1/4">
          <Filters />
        </div>
        <div className="w-full px-2.5 sm:w-3/4">
          {showPagination && <Pagination />}

          <div id="projectListRow">
            {projectsLoaded && filtersLoaded ? (
              <ProjectList />
            ) : (
              <div>Loading ...</div>
            )}
          </div>

          {showPagination && <Pagination />}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsBrowser({ api_url }: { api_url: string }) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms values={new Map<WritableAtom<any, any[], any>, unknown>([[apiUrlAtom, api_url]])}>
        <ProjectsBrowserInner />
      </HydrateAtoms>
    </Provider>
  );
}
