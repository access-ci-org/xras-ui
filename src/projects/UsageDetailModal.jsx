import { statuses } from "./helpers/apiSlice";
import { useProject, useRequest } from "./helpers/hooks";
import {
  acctRolesMap,
  formatNumber,
  parseResourceName,
} from "../shared/helpers/utils";

import Alert from "../shared/Alert";
import Modal from "react-bootstrap/Modal";
import LoadingSpinner from "../shared/LoadingSpinner";
import Grid from "../shared/Grid";
import UserName from "../shared/UserName";

export default function UsageDetailModal({ requestId, grantNumber }) {
  const { project } = useProject(grantNumber);
  const { request, closeUsageDetailModal } = useRequest(requestId, grantNumber);

  if (
    !request ||
    request.error ||
    !project ||
    project.error ||
    !request.usageDetailStatus
  )
    return;

  let modalBody;
  let modalTitle = "Usage";
  if (request.usageDetailStatus == statuses.pending)
    modalBody = <LoadingSpinner />;
  else if (request.usageDetailStatus == statuses.error)
    modalBody = (
      <Alert color="danger">An error occurred while loading usage data.</Alert>
    );
  else {
    const { projectTitle, resourceDisplayName, resourceRepositoryKey, users } =
      request.usageDetail;
    const { full, short } = parseResourceName(resourceDisplayName);

    const resource = request.resources.find(
      (res) => res.resourceRepositoryKey == resourceRepositoryKey
    );
    const formatNumberRes = (value) =>
      formatNumber(value, {
        decimalPlaces: resource ? resource.decimalPlaces : undefined,
      });

    const usersMap = {};
    for (let user of project.users) usersMap[user.username] = user;

    modalTitle = (
      <>
        Usage: {short ? short : full} for {projectTitle}
      </>
    );
    const columns = [
      {
        key: "name",
        name: "Name",
        format: (value, { lastName, firstName, portalUsername }) => {
          const user = usersMap[portalUsername];
          return user ? <UserName user={user} /> : `${lastName}, ${firstName}`;
        },
      },
      {
        key: "portalUsername",
        name: "Resource Username",
        format: (value) => {
          const user = usersMap[value];
          const resourceUsername = user
            ? user.resourceUsernames[resource.resourceId]
            : null;
          return resourceUsername ? resourceUsername : <>&mdash;</>;
        },
      },
      {
        key: "role",
        name: "Role",
        format: (value) => acctRolesMap[value].name,
      },
      {
        key: "lastWeek",
        name: "Last Week",
        class: "text-end",
        format: formatNumberRes,
      },
      {
        key: "lastMonth",
        name: "Last Month",
        class: "text-end",
        format: formatNumberRes,
      },
      {
        key: "lastQuarter",
        name: "Last 3 Months",
        class: "text-end",
        format: formatNumberRes,
      },
      {
        key: "currentRequest",
        name: "Current Allocation",
        class: "text-end",
        format: formatNumberRes,
      },
      {
        key: "total",
        name: "All Time",
        class: "text-end",
        format: formatNumberRes,
      },
    ];
    modalBody = users.length ? (
      <Grid rows={users} columns={columns} />
    ) : (
      <Alert color="info">There is no usage for this resource.</Alert>
    );
  }

  return (
    <Modal
      show={true}
      size="lg"
      onHide={closeUsageDetailModal}
      scrollable={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{modalBody}</Modal.Body>
    </Modal>
  );
}
