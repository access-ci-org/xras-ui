import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Alert from "../shared/Alert";
import config from "../shared/helpers/config";
import ActionsModal from "./ActionsModal";
import ConfirmModal from "./ConfirmModal";
import DeleteModal from "./DeleteModal";
import History from "./History";
import Overview from "./Overview";
import ProjectPublications from "./ProjectPublications";
import Resources from "./Resources";
import ResourcesModal from "./ResourcesModal";
import UsageDetailModal from "./UsageDetailModal";
import Users from "./Users";
import { useProject, useRequest } from "./helpers/hooks";

export default function Request({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request } = useRequest(requestId, grantNumber);
  const { project, setRequest, setTab } = useProject(grantNumber || request?.grantNumber);

  if (!request) return null;
  if (request.error) return <Alert color="danger">{request.error}</Alert>;
  if (!project) return null;

  const displayStatus = request.timeStatus || request.actions[0].status.toLowerCase();

  const deleteAction = request.actions.find(({ showDeleteModal }) => showDeleteModal);

  const disabledTabs = [];
  if (!request.resources.length) disabledTabs.push("resources");
  if (requestId != project.currentRequestId) disabledTabs.push("users");

  const ineligibleUsers = (project.users || []).filter(
    (user) => user.eligibility === "no" && user.role !== "user",
  );

  return (
    <div>
      {request.returnedForCorrections ? (
        <Alert color="warning">
          <p>
            Your request has been returned for corrections. These are the notes from the Allocations Team
          </p>
          <div className="rounded border-l-[20px] border-l-[#a70000] bg-white p-2.5 text-base whitespace-pre-wrap">
            {request.returnedForCorrectionsNotes}
          </div>
          <p className="mt-3">
            Please address these issues by clicking the Edit button to edit your request.
          </p>
        </Alert>
      ) : (
        ""
      )}
      {request.timeStatus != "current" && !request.returnedForCorrections ? (
        <Alert color="warning">
          You are viewing {"aeiou".includes(displayStatus[0]) ? "an" : "a"} {displayStatus} request.{" "}
          {disabledTabs.length ? `You cannot manage ${disabledTabs.join(" or ")} for this request.` : ""}{" "}
          {project.currentRequestId ? (
            <a
              href={config.routes.request_path(project.currentRequestId)}
              onClick={(e) => {
                e.preventDefault();
                setRequest(project.currentRequestId!);
              }}
            >
              Go to the current request.
            </a>
          ) : null}
        </Alert>
      ) : null}
      {project.isManager && ineligibleUsers.length > 0 && (
        <Alert color="danger">
          Some project personnel need to update their profiles. You will be unable to submit exchanges,
          renewals, and other actions until these issues are resolved:
          <br />
          <ul className="mb-0 text-sm">
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
      <Tabs value={project.tab} onValueChange={setTab} className="mb-3 mt-3">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources" disabled={disabledTabs.includes("resources")}>
            {request.usesCredits ? "Credits + Resources" : "Resources"}
          </TabsTrigger>
          <TabsTrigger value="users" disabled={disabledTabs.includes("users")}>
            Users + Roles
          </TabsTrigger>
          <TabsTrigger value="publications">Publications</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mb-0">
          <Overview requestId={requestId} grantNumber={grantNumber} />
        </TabsContent>
        <TabsContent value="resources">
          <Resources requestId={requestId} />
        </TabsContent>
        <TabsContent value="users">
          <Users grantNumber={grantNumber} />
        </TabsContent>
        <TabsContent value="publications">
          <ProjectPublications grantNumber={grantNumber} />
        </TabsContent>
        <TabsContent value="history">
          <History requestId={requestId} grantNumber={grantNumber} />
        </TabsContent>
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
