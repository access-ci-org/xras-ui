import { useEffect, useMemo } from "react";
import { Provider, createStore, useAtomValue, useSetAtom, type WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import Alert from "../shared/Alert";
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
      <div>
        {errors.map((error, index) => (
          <Alert key={index} color="danger" dismissable>
            {error}
          </Alert>
        ))}
      </div>
    );
  }

  if (!resourceData) return <div>No resource data available.</div>;

  return (
    <div className="edit-resource">
      {successMessage.message && (
        <Alert color={successMessage.color} dismissable>
          {successMessage.message}
        </Alert>
      )}
      <div>
        <h2>Resource Properties</h2>
        <p className="mb-3 font-bold italic">
          Any modifications to these resource properties will be applied globally and impact
          resources on other all allocations process
        </p>
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
