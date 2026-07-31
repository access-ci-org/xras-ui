import OverviewHistory from "./OverviewHistory";
import OverviewResources from "./OverviewResources";
import OverviewUsers from "./OverviewUsers";
import { useProject, useRequest } from "./helpers/hooks";

export default function Overview({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request } = useRequest(requestId, grantNumber);
  const { project } = useProject(grantNumber || request?.grantNumber);

  if (!request || !project || request.error || project.error) return null;

  return (
    <div>
      <OverviewResources requestId={requestId} grantNumber={grantNumber} />
      {project.isManager ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <OverviewUsers grantNumber={grantNumber} />
          </div>
          <div>
            <OverviewHistory requestId={requestId} grantNumber={grantNumber} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
