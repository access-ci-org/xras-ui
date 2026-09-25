import Grid, { type GridColumn } from "../shared/Grid";
import StatusBadge from "../shared/StatusBadge";
import ActionTitle from "./ActionTitle";
import { useRequest } from "./helpers/hooks";
import type { Action } from "./types";

export default function OverviewHistory({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, toggleDeleteModal } = useRequest(requestId, grantNumber);
  if (!request) return null;

  const columns: GridColumn[] = [
    {
      key: "type",
      name: "Action Details",
      format: (_value, row) => (
        <ActionTitle action={row as Action} request={request} toggleDeleteModal={toggleDeleteModal} />
      ),
    },
    {
      key: "status",
      name: "Status",
      format: (value) => <StatusBadge status={value} />,
    },
  ];

  if (request.actions && request.actions.length) return <Grid rows={request.actions} columns={columns} />;
  return null;
}
