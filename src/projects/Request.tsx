import { useAtomValue } from "jotai";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Alert from "../shared/Alert";
import { routesAtom, type RouteOverrides } from "../shared/routes";
import ActionsModal from "./ActionsModal";
import ConfirmModal from "./ConfirmModal";
import DeleteModal from "./DeleteModal";
import History from "./History";
import InternationalUserRequest from "./InternationalUserRequest";
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
  routes,
}: {
  requestId: number;
  grantNumber: string;
  routes?: RouteOverrides;
}) {
  const { request } = useRequest(requestId, grantNumber);
  const routesValue = useAtomValue(routesAtom);
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

  // The tab is gated on the key being *present*, not on it being non-empty:
  // the API omits it entirely for projects whose allocation needs no
  // International User Justifications (see `addProject` in atoms.ts).
  const hasInternationalUserRequests = !!project.internationalUserRequests;
  const hasIncompleteInternationalUserRequest = (project.internationalUserRequests || []).some(
    ({ status }) => status === "Incomplete",
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
          <p className="mt-4">
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
              href={routesValue.request_path(project.currentRequestId)}
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
      {hasIncompleteInternationalUserRequest && (
        <Alert color="danger">
          There is an incomplete International User Justification form that requires your attention.
          Check the &ldquo;Intl. Users&rdquo; tab for more details.
        </Alert>
      )}
      {/*
        react-bootstrap put this element's `mt-3 mb-3` on the tab *bar*, so the
        bottom margin sat between the bar and the panel (see `TabsContent`),
        not below the panel.
      */}
      <Tabs value={project.tab} onValueChange={setTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources" disabled={disabledTabs.includes("resources")}>
            {request.usesCredits ? "Credits + Resources" : "Resources"}
          </TabsTrigger>
          <TabsTrigger value="users" disabled={disabledTabs.includes("users")}>
            Users + Roles
          </TabsTrigger>
          {hasInternationalUserRequests && (
            <TabsTrigger value="international">Intl. Users</TabsTrigger>
          )}
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
        {hasInternationalUserRequests && (
          <TabsContent value="international">
            <InternationalUserRequest project={project} requestId={requestId} />
          </TabsContent>
        )}
        <TabsContent value="publications">
          <ProjectPublications grantNumber={grantNumber} routes={routes} />
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
