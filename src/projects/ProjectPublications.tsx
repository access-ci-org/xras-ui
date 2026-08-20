import { useMemo } from "react";
import { Provider, createStore, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { buttonVariants } from "@/components/ui/button";
import { mergeRoutes, routesAtom, type RouteOverrides } from "../shared/routes";
import Publications from "./Publications";

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

// `publications_path` (below) and the routes `Publications` needs
// (search_publications_path, search_publications_filters_path, ...) are Rails
// routes with no `defaultRoutes` entry (src/shared/routes.ts) - they only
// exist once the host page supplies them. `Publications` mounts its own
// jotai store (it reuses the publications feature's atoms, which are keyed to
// whatever store reads them), so it needs its own `routesAtom` hydration -
// hydrating the outer `projects` store's `routesAtom` wouldn't reach it. Both
// this component and its inner store are handed the same `routes` the host
// passed to the `projects` mount function (see src/main.jsx), not a
// publications-mount's routes - there is no publications mount here to share.
export default function ProjectPublications({
  grantNumber,
  routes,
}: {
  grantNumber: string;
  routes?: RouteOverrides;
}) {
  const store = useMemo(() => createStore(), []);
  const mergedRoutes = useMemo(() => mergeRoutes(routes), [routes]);

  return (
    <>
      <Provider store={store}>
        <HydrateAtoms values={new Map<WritableAtom<any, any[], any>, unknown>([[routesAtom, mergedRoutes]])}>
          <Publications grantNumber={grantNumber} />
        </HydrateAtoms>
      </Provider>
      <div>
        <a href={mergedRoutes.publications_path()} className={buttonVariants()}>
          Add or Manage Publications
        </a>
      </div>
    </>
  );
}
