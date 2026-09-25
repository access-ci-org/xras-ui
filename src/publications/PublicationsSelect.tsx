import { useEffect, useMemo } from "react";
import { Provider, createStore, useSetAtom, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { mergeRoutes, routesAtom, type RouteOverrides } from "../shared/routes";
import PublicationsAlerts from "./PublicationsAlerts";
import PublicationsGrid from "./PublicationsGrid";
import {
  addCreatedByUsernameAtom,
  authenticityTokenAtom,
  filterSelectionsAtom,
  removeCreatedByUsernameAtom,
  selectedPublicationIdsAtom,
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

function PublicationsSelectInner() {
  const addCreatedByUsername = useSetAtom(addCreatedByUsernameAtom);
  const removeCreatedByUsername = useSetAtom(removeCreatedByUsernameAtom);

  useEffect(() => {
    const onAdd = ((e: CustomEvent<{ username: string }>) =>
      addCreatedByUsername(e.detail.username)) as EventListener;
    const onRemove = ((e: CustomEvent<{ username: string }>) =>
      removeCreatedByUsername(e.detail.username)) as EventListener;

    addEventListener("requestAddRole", onAdd);
    addEventListener("requestRemoveRole", onRemove);
    return () => {
      removeEventListener("requestAddRole", onAdd);
      removeEventListener("requestRemoveRole", onRemove);
    };
  }, [addCreatedByUsername, removeCreatedByUsername]);

  return (
    <>
      <PublicationsAlerts />
      <PublicationsGrid allowSelect />
    </>
  );
}

export default function PublicationsSelect({
  authenticityToken,
  routes,
  selectedPublicationIds,
  usernames,
}: {
  authenticityToken: string;
  routes?: RouteOverrides;
  selectedPublicationIds: (number | string)[];
  usernames: string[];
}) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms
        values={
          new Map<WritableAtom<any, any[], any>, unknown>([
            [authenticityTokenAtom, authenticityToken],
            [routesAtom, mergeRoutes(routes)],
            [selectedPublicationIdsAtom, selectedPublicationIds],
            [
              filterSelectionsAtom,
              {
                createdBy: usernames,
                doi: "",
                grantNumber: "",
                journal: "",
                authorName: "",
                publicationType: "",
              },
            ],
          ])
        }
      >
        <PublicationsSelectInner />
      </HydrateAtoms>
    </Provider>
  );
}
