import { Button } from "@/components/ui/button";
import { useRequest } from "./helpers/hooks";

export default function ExtendButton({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, toggleActionsModal } = useRequest(requestId, grantNumber);
  if (
    !request ||
    !request.allowedActions ||
    !("Extension" in request.allowedActions || "Renewal" in request.allowedActions)
  )
    return null;

  return (
    <Button className="ml-2 whitespace-nowrap" onClick={() => toggleActionsModal()}>
      Extend End Date
    </Button>
  );
}
