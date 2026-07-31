import { buttonVariants } from "@/components/ui/button";
import { useRequest } from "./helpers/hooks";
import config from "../shared/helpers/config";

export default function FinalReportButton({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request } = useRequest(requestId, grantNumber);
  if (!request || !request.allowedActions || !("Final Report" in request.allowedActions)) return null;

  return (
    <a
      className={buttonVariants({ className: "ml-2 whitespace-nowrap" })}
      href={`${config.routes.request_action_path(requestId, "new")}?action_type=Final+Report`}
    >
      Submit Final Report
    </a>
  );
}
