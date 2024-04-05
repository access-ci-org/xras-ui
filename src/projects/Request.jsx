import { useRequest, useProject } from "./helpers/hooks";
import config from "../shared/helpers/config";

import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import ActionsModal from "./ActionsModal";
import Alert from "../shared/Alert";
import ConfirmModal from "./ConfirmModal";
import DeleteModal from "./DeleteModal";
import History from "./History";
import Overview from "./Overview";
import Resources from "./Resources";
import ResourcesModal from "./ResourcesModal";
import UsageDetailModal from "./UsageDetailModal";
import Users from "./Users";

export default function Request({ requestId, grantNumber }) {
  const { request } = useRequest(requestId, grantNumber);
  const { project, setRequest, setTab } = useProject(
    grantNumber || request.grantNumber
  );

  if (!request) return;
  if (request.error) return <Alert color="danger">{request.error}</Alert>;

  const displayStatus =
    request.timeStatus || request.actions[0].status.toLowerCase();

  const deleteAction = request.actions.find(
    ({ showDeleteModal }) => showDeleteModal
  );

  const disabledTabs = [];
  if (!request.resources.length) disabledTabs.push("resources");
  if (requestId != project.currentRequestId) disabledTabs.push("users");

  return (
    <div className="request">
      {request.timeStatus != "current" ? (
        <Alert color="warning">
          You are viewing {"aeiou".includes(displayStatus[0]) ? "an" : "a"}{" "}
          {displayStatus} request.{" "}
          {disabledTabs.length
            ? `You cannot manage ${disabledTabs.join(" or ")} for this request.`
            : ""}{" "}
          {project.currentRequestId ? (
            <a
              href={config.routes.request_path(project.currentRequestId)}
              onClick={(e) => {
                e.preventDefault();
                setRequest(project.currentRequestId);
              }}
            >
              Go to the current request.
            </a>
          ) : null}
        </Alert>
      ) : null}
      <Tabs activeKey={project.tab} onSelect={setTab} className="mt-3 mb-3">
        <Tab eventKey="overview" title="Overview" className="mb-0">
          <Overview requestId={requestId} grantNumber={grantNumber} />
        </Tab>
        <Tab
          eventKey="resources"
          title={request.usesCredits ? "Credits + Resources" : "Resources"}
          disabled={disabledTabs.includes("resources")}
        >
          <Resources requestId={requestId} />
        </Tab>
        <Tab
          eventKey="users"
          title="Users + Roles"
          disabled={disabledTabs.includes("users")}
        >
          <Users grantNumber={grantNumber} />
        </Tab>
        <Tab eventKey="history" title="History">
          <History requestId={requestId} />
        </Tab>
      </Tabs>
      <ActionsModal grantNumber={grantNumber} requestId={requestId} />
      <ConfirmModal grantNumber={grantNumber} requestId={requestId} />
      <DeleteModal
        grantNumber={grantNumber}
        requestId={requestId}
        actionId={deleteAction ? deleteAction.actionId : null}
      />
      <ResourcesModal grantNumber={grantNumber} requestId={requestId} />
      <UsageDetailModal grantNumber={grantNumber} requestId={requestId} />
    </div>
  );
}
