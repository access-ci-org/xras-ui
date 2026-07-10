import { useRequest, useProject } from "./helpers/hooks";
import config from "../shared/helpers/config";
import style from "./Request.module.scss";

import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";

import ActionsModal from "./ActionsModal";
import Alert from "../shared/Alert";
import ConfirmModal from "./ConfirmModal";
import DeleteModal from "./DeleteModal";
import History from "./History";
import InternationalUserRequest from "./InternationalUserRequest";
import Overview from "./Overview";
import Resources from "./Resources";
import ResourcesModal from "./ResourcesModal";
import UsageDetailModal from "./UsageDetailModal";
import Users from "./Users";
import ProjectPublications from "./ProjectPublications";

export default function Request({ requestId, grantNumber }) {
  const { request } = useRequest(requestId, grantNumber);
  const { project, setRequest, setTab } = useProject(
    grantNumber || request.grantNumber,
  );

  if (!request) return;
  if (request.error) return <Alert color="danger">{request.error}</Alert>;

  const displayStatus =
    request.timeStatus || request.actions[0].status.toLowerCase();

  const deleteAction = request.actions.find(
    ({ showDeleteModal }) => showDeleteModal,
  );

  const disabledTabs = [];
  if (!request.resources.length) disabledTabs.push("resources");
  if (requestId != project.currentRequestId) disabledTabs.push("users");

  const ineligibleUsers = (project.users || []).filter(
    (user) => user.eligibility === "no" && user.role !== "user",
  );

  return (
    <div className="request">
      {request.returnedForCorrections ? (
        <Alert color="warning">
          <p>
            Your request has been returned for corrections. These are the notes
            from the Allocations Team
          </p>
          <div className={style.returnedForCorrectionsNotes}>
            {request.returnedForCorrectionsNotes}
          </div>
          <p className="mt-3">
            Please address these issues by clicking the Edit button to edit your
            request.
          </p>
        </Alert>
      ) : (
        ""
      )}
      {request.timeStatus != "current" && !request.returnedForCorrections ? (
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
      {project.isManager && ineligibleUsers.length > 0 && (
        <Alert color="danger">
          Some project personnel need to update their profiles. You will be
          unable to submit exchanges, renewals, and other actions until these
          issues are resolved:
          <br />
          <ul className="fs-6 mb-0">
            {ineligibleUsers.map((user) => (
              <li key={user.username}>
                <strong>
                  {user.firstName} {user.lastName} ({user.username}):
                </strong>{" "}
                {user.eligibilityReason}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {project.isManager && project.iurs && project.iurs.some(p => p.status === "Incomplete") && (
        <Alert color="danger">
          There is an incomplete International User Request form that requires your attention.
          Check the "Intl. Users" tab for more details.
        </Alert>
      )}
      {project.isManager && !project.iurs && project.iurRequired && (
        <Alert color="danger">
          This project has International Users but no International User Justification form has been created.
          <br />
          <a href={config.routes.justification_request_path(requestId)}>Create an International User Justification</a>
        </Alert>
      )}
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
        {project.isManager && project.iurs && (
          <Tab eventKey="international" title="Intl. Users">
            <InternationalUserRequest project={project} requestId={requestId} />
          </Tab>
        )}
        <Tab eventKey="publications" title="Publications">
          <ProjectPublications
            grantNumber={grantNumber}
            requestId={requestId}
          />
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
