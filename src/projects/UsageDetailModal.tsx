import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Alert from "../shared/Alert";
import Grid, { type GridColumn } from "../shared/Grid";
import LoadingSpinner from "../shared/LoadingSpinner";
import UserName from "../shared/UserName";
import { acctRolesMap, formatNumber, parseResourceName } from "../shared/helpers/utils";
import { statuses } from "./atoms";
import { useProject, useRequest } from "./helpers/hooks";
import type { UsageDetailUser } from "./types";

export default function UsageDetailModal({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { project } = useProject(grantNumber);
  const { request, closeUsageDetailModal } = useRequest(requestId, grantNumber);

  if (!request || request.error || !project || project.error || !request.usageDetailStatus) return null;

  let modalBody;
  let modalTitle: React.ReactNode = "Usage";
  if (request.usageDetailStatus == statuses.pending) modalBody = <LoadingSpinner />;
  else if (request.usageDetailStatus == statuses.error)
    modalBody = <Alert color="danger">An error occurred while loading usage data.</Alert>;
  else {
    const { projectTitle, resourceDisplayName, resourceRepositoryKey, users } = request.usageDetail!;
    const { full, short } = parseResourceName(resourceDisplayName);

    const resource = request.resources.find((res) => res.resourceRepositoryKey == resourceRepositoryKey);
    const formatNumberRes = (value: number) =>
      formatNumber(value, { decimalPlaces: resource ? resource.decimalPlaces : undefined });

    const usersMap: Record<string, (typeof project.users)[number]> = {};
    for (const user of project.users) usersMap[user.username] = user;

    modalTitle = (
      <>
        Usage: {short ? short : full} for {projectTitle}
      </>
    );
    const columns: GridColumn[] = [
      {
        key: "name",
        name: "Name",
        format: (_value, row) => {
          const { lastName, firstName, portalUsername } = row as UsageDetailUser;
          const user = usersMap[portalUsername];
          return user ? <UserName user={user} /> : `${lastName}, ${firstName}`;
        },
      },
      {
        key: "portalUsername",
        name: "Resource Username",
        format: (value) => {
          const user = usersMap[value];
          const resourceUsername = user && resource ? user.resourceUsernames[resource.resourceId] : null;
          return resourceUsername ? resourceUsername : <>&mdash;</>;
        },
      },
      {
        key: "role",
        name: "Role",
        format: (value) => acctRolesMap[value].name,
      },
      { key: "lastWeek", name: "Last Week", class: "text-right", format: formatNumberRes },
      { key: "lastMonth", name: "Last Month", class: "text-right", format: formatNumberRes },
      { key: "lastQuarter", name: "Last 3 Months", class: "text-right", format: formatNumberRes },
      {
        key: "currentRequest",
        name: "Current Allocation",
        class: "text-right",
        format: formatNumberRes,
      },
      { key: "total", name: "All Time", class: "text-right", format: formatNumberRes },
    ];
    modalBody = users.length ? (
      <Grid rows={users} columns={columns} />
    ) : (
      <Alert color="info">There is no usage for this resource.</Alert>
    );
  }

  return (
    <Dialog open onOpenChange={() => closeUsageDetailModal()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
}
