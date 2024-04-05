import { useRequest } from "./helpers/hooks";
import config from "../shared/helpers/config";

export default function FinalReportButton({ requestId, grantNumber }) {
  const { request } = useRequest(requestId, grantNumber);
  if (
    !request ||
    !request.allowedActions ||
    !("Final Report" in request.allowedActions)
  )
    return;

  return (
    <a
      className="btn btn-primary ms-2 text-nowrap"
      href={`${config.routes.request_action_path(
        requestId,
        "new"
      )}?action_type=Final+Report`}
    >
      Submit Final Report
    </a>
  );
}
