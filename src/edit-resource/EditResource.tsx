import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { cn } from "@/lib/utils";
import AdminAlert from "../shared/AdminAlert";
import { ADMIN_BODY, ADMIN_H2 } from "../shared/adminTheme";
import LoadingSpinner from "../shared/LoadingSpinner";
import { AllocationTypesSection } from "./AllocationTypesGrid";
import { ExchangeRates } from "./ExchangeRates";
import { ResourceForm } from "./ResourceForm";
import {
  dateErrorsAtom,
  errorsAtom,
  fetchResourceDataAtom,
  loadingAtom,
  relativeUrlRootAtom,
  resourceDataAtom,
  resourceIdAtom,
  submitResourceAtom,
  successMessageAtom,
  usesExchangeRatesAtom,
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

type EditResourceProps = {
  resourceId: number;
  relativeUrlRoot: string;
  setExternalSubmit?: (submit: (() => Promise<boolean>) | null) => void;
};

function EditResourceInner({ setExternalSubmit }: Pick<EditResourceProps, "setExternalSubmit">) {
  const loading = useAtomValue(loadingAtom);
  const errors = useAtomValue(errorsAtom);
  const resourceData = useAtomValue(resourceDataAtom);
  const successMessage = useAtomValue(successMessageAtom);
  const usesExchangeRates = useAtomValue(usesExchangeRatesAtom);
  const dateErrors = useAtomValue(dateErrorsAtom);
  const fetchResourceData = useSetAtom(fetchResourceDataAtom);
  const submitResource = useSetAtom(submitResourceAtom);

  useEffect(() => {
    fetchResourceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (setExternalSubmit && dateErrors.length === 0) {
      setExternalSubmit(submitResource);
    } else {
      setExternalSubmit?.(null);
    }
  }, [submitResource, setExternalSubmit, dateErrors]);

  if (loading) return <LoadingSpinner />;

  if (errors.length > 0) {
    return (
      <div className={ADMIN_BODY}>
        {errors.map((error, index) => (
          <AdminAlert key={index} color="danger" dismissable>
            {error}
          </AdminAlert>
        ))}
      </div>
    );
  }

  if (!resourceData) return <div className={ADMIN_BODY}>No resource data available.</div>;

  return (
    <div className={cn("edit-resource", ADMIN_BODY)}>
      {successMessage.message && (
        <AdminAlert color={successMessage.color} dismissable>
          {successMessage.message}
        </AdminAlert>
      )}
      <div>
        <h2 className={ADMIN_H2}>Resource Properties</h2>
        <div className="mb-3">
          <p className="m-0 text-sm font-bold italic">
            Any modifications to these resource properties will be applied globally and impact
            resources on other all allocations process
          </p>
        </div>
        <ResourceForm />
      </div>
      {usesExchangeRates && <ExchangeRates />}
      <AllocationTypesSection />
    </div>
  );
}

export default function EditResource({
  resourceId,
  relativeUrlRoot,
  setExternalSubmit,
}: EditResourceProps) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <HydrateAtoms
        values={
          new Map<WritableAtom<any, any[], any>, unknown>([
            [resourceIdAtom, resourceId],
            [relativeUrlRootAtom, relativeUrlRoot],
          ])
        }
      >
        <EditResourceInner setExternalSubmit={setExternalSubmit} />
      </HydrateAtoms>
    </Provider>
  );
}
