import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import PublicationAddButton from "./PublicationAddButton";
import PublicationDismissPublicationsNotice from "./PublicationDismissPublicationsNotice";
import PublicationEditModal from "./PublicationEditModal";
import PublicationsAlerts from "./PublicationsAlerts";
import PublicationsList from "./PublicationsList";
import {
  authenticityTokenAtom,
  filterSelectionsAtom,
  getFiltersAtom,
  getPublicationsAtom,
  savingAtom,
  showUpdatePublicationsAtom,
  usePaginationAtom,
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

function MyPublicationsInner({ showUpdatePublications }: { showUpdatePublications: boolean }) {
  const saving = useAtomValue(savingAtom);
  const setUsePagination = useSetAtom(usePaginationAtom);
  const getPublications = useSetAtom(getPublicationsAtom);
  const getFilters = useSetAtom(getFiltersAtom);

  useEffect(() => {
    if (!saving) {
      setUsePagination(false);
      getPublications();
      getFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving]);

  return (
    <>
      <PublicationsAlerts />
      <div className="flex items-start justify-between">
        <h1>My Publications</h1>
        <div className="flex gap-2">
          {showUpdatePublications && <PublicationDismissPublicationsNotice />}
          <PublicationAddButton />
        </div>
      </div>
      <PublicationsList />
      <PublicationEditModal />
    </>
  );
}

export default function MyPublications({
  authenticityToken,
  username,
  showUpdatePublications,
}: {
  authenticityToken: string;
  username: string;
  showUpdatePublications: boolean;
}) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms
        values={
          new Map<WritableAtom<any, any[], any>, unknown>([
            [authenticityTokenAtom, authenticityToken],
            [showUpdatePublicationsAtom, showUpdatePublications],
            [
              filterSelectionsAtom,
              {
                createdBy: [username],
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
        <MyPublicationsInner showUpdatePublications={showUpdatePublications} />
      </HydrateAtoms>
    </Provider>
  );
}
