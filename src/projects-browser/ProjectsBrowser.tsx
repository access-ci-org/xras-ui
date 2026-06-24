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
    initApp();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="sm:w-1/4">
          <Filters />
        </div>
        <div className="sm:w-3/4">
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
