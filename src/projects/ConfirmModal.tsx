import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getResourceUsagePercent } from "../shared/helpers/utils";
import { useProject, useRequest } from "./helpers/hooks";

export default function ConfirmModal({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, toggleActionsModal, toggleConfirmModal } = useRequest(requestId, grantNumber);
  const { project } = useProject(grantNumber || request?.grantNumber);

  if (!request || !project || request.error || project.error) return null;

  const unitName = request.usesCredits ? "credits" : "units";
  const unusedPercent = (1 - getResourceUsagePercent(request)) * 100;

  return (
    <Dialog open={request.showConfirmModal} onOpenChange={() => toggleConfirmModal()}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Consider Requesting an Exchange</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <p>
            <strong>{Math.round(unusedPercent)}% of your allocation is unused.</strong> Are you sure
            you want to request more {unitName}? You can exchange{" "}
            {request.usesCredits ? "credits for resources or " : ""} one resource for another by
            changing the <strong>balance</strong> numbers in the table on the previous screen.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => toggleConfirmModal()}>Return to Exchange</Button>
          <Button
            variant="secondary"
            onClick={() => {
              toggleConfirmModal();
              toggleActionsModal();
            }}
          >
            Request More {unitName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
