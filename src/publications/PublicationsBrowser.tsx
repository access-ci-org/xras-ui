import { useEffect, useMemo } from "react";
import { Provider, createStore, useSetAtom, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { mergeRoutes, routesAtom, type RouteOverrides } from "../shared/routes";
import Filters from "./Filters";
import PublicationsAlerts from "./PublicationsAlerts";
import PublicationsList from "./PublicationsList";
import { getFiltersAtom, getPublicationsAtom } from "./atoms";

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

function PublicationsBrowserInner() {
  const getPublications = useSetAtom(getPublicationsAtom);
  const getFilters = useSetAtom(getFiltersAtom);

  useEffect(() => {
    getPublications();
    getFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* Bootstrap's `.container-fluid > .row > .col-sm-3 / .col-sm-9`. The host
       app builds Bootstrap with a 1.25rem grid gutter, halved into the padding
       of each column and cancelled again by the row's negative margin, so the
       columns sit a full gutter apart but flush with the container's edges. */
    <div className="px-2.5">
      {/* Both effects above surface fetch failures through `addErrorAtom`, so
          this view needs somewhere to render them - the other three mounts
          already had one. */}
      <PublicationsAlerts />
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

export default function PublicationsBrowser({ routes }: { routes?: RouteOverrides }) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms
        values={
          new Map<WritableAtom<any, any[], any>, unknown>([
            [routesAtom, mergeRoutes(routes)],
          ])
        }
      >
        <PublicationsBrowserInner />
      </HydrateAtoms>
    </Provider>
  );
}
