import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Alert from "../shared/Alert";
import { formatDate, formatRequestName } from "../shared/helpers/utils";
import { statuses } from "./atoms";
import { useRequest } from "./helpers/hooks";

export default function DeleteModal({
  requestId,
  grantNumber,
  actionId,
}: {
  requestId: number;
  grantNumber: string;
  actionId: number | null;
}) {
  const { deleteAction, request, toggleDeleteModal } = useRequest(requestId, grantNumber);
  if (!request || request.error) return null;

  const action = request.actions.find((requestAction) => requestAction.actionId == actionId);
  if (!action) return null;

  const { deleteStatus, isRequest } = action;
  const pending = deleteStatus == statuses.pending;
  const error = deleteStatus == statuses.error;
  const toggle = () => toggleDeleteModal(actionId!);

  return (
    <Dialog open={action.showDeleteModal} onOpenChange={toggle}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {error && (
            <Alert color="danger">Deletion of the {isRequest ? "request" : "action"} failed.</Alert>
          )}
          <p>
          Are you sure you want to delete{" "}
          {!isRequest && (
            <>
              action{" "}
              <strong>
                {action.type}: {formatDate(action.date)}
              </strong>{" "}
              on{" "}
            </>
          )}
            request <strong>{formatRequestName(request)}</strong>? Deletions cannot be undone.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={toggle} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => deleteAction(actionId!)} disabled={pending}>
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
