import { useAtomValue, useSetAtom } from "jotai";
import Alert from "../shared/Alert";
import { errorsAtom, hideErrorAtom, showSavedAtom } from "./atoms";

export default function PublicationsAlerts() {
  const errors = useAtomValue(errorsAtom);
  const showSaved = useAtomValue(showSavedAtom);
  const hideError = useSetAtom(hideErrorAtom);
  const setShowSaved = useSetAtom(showSavedAtom);

  return (
    <>
      {showSaved && (
        <Alert color="success" dismissable onDismiss={() => setShowSaved(false)}>
          Publication Saved Successfully!
        </Alert>
      )}
      {errors.map((err) => (
        <Alert key={err.id} color="danger" dismissable onDismiss={() => hideError(err.id)}>
          {err.message}
        </Alert>
      ))}
    </>
  );
}
