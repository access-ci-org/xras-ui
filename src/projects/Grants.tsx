import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import Alert from "../shared/Alert";
import { routesAtom } from "../shared/routes";
import AddGrantModal from "./AddGrantModal";
import { requestsAtom } from "./atoms";
import Grant from "./Grant";
import GrantEditModal from "./GrantEditModal";
import {
  grantsEditableInProjects,
  otherGrantEditableRequests,
  type OtherGrantRequest,
} from "./helpers/grants";
import { useProject, useRequest } from "./helpers/hooks";

// Shown with the saved message: each request keeps its own copy of its
// supporting grants, so a change made here doesn't reach (say) the renewal
// that's still being written, and vice versa.
function OtherRequestsReminder({ others }: { others: OtherGrantRequest[] }) {
  const routes = useAtomValue(routesAtom);
  const howToEdit = ({ request, name, editIn }: OtherGrantRequest) =>
    editIn == "form" ? (
      <a href={routes.edit_request_path(request.requestId)}>Edit {name}</a>
    ) : (
      <>
        Select <strong>{name}</strong> in the request menu above
      </>
    );

  if (others.length === 1)
    return (
      <Alert color="warning">
        This project also has another request with its own copy of the supporting grants. You may
        want to make the same change there. {howToEdit(others[0])}
        {others[0].editIn == "projects" && "."}
      </Alert>
    );

  return (
    <Alert color="warning">
      This project also has these requests, each with its own copy of the supporting grants. You may
      want to make the same change on them.
      <ul className="mb-0 list-disc pl-6">
        {others.map((other) => (
          <li key={other.request.requestId}>{howToEdit(other)}</li>
        ))}
      </ul>
    </Alert>
  );
}

// Managers may edit most fields on a grant; grantNumber and the pending
// answer lock once an existing grant has been awarded (see
// editableGrantFields in atoms.ts, enforced again server-side by
// save_grants in xras_submit_access).
const MANAGER_ROLES = ["pi", "co_pi", "allocation_manager"];

export default function Grants({ grantNumber, requestId }: { grantNumber: string; requestId?: number }) {
  const { project } = useProject(grantNumber);
  const effectiveRequestId = requestId ?? project?.currentRequestId ?? undefined;
  const { request, editGrant, statuses, toggleAddGrantModal } = useRequest(effectiveRequestId, grantNumber);
  const requests = useAtomValue(requestsAtom);

  if (!project || !request || project.error || request.error) return null;

  // `undefined` (as opposed to `[]`) means the host API predates the projects
  // payload carrying grants at all - see the Grant/Request type comments.
  // Request.tsx already gates the tab on this, but this component can be
  // (and is, in tests) rendered on its own, so it repeats the guard.
  const grants = request.grants;
  if (grants === undefined) return null;

  // See grantsEditableInProjects for which requests' grants are editable here.
  const canEdit =
    MANAGER_ROLES.includes(project.currentUser?.role ?? "") && grantsEditableInProjects(request);

  const otherRequests =
    canEdit && effectiveRequestId != null
      ? otherGrantEditableRequests(project, requests, effectiveRequestId)
      : [];

  return (
    <>
      {/* A failed save leaves its errors in the still-open modal, so only the
          success case has anything to report out here. */}
      {request.grantsStatus == statuses.success && (
        <>
          <Alert color="info">Your changes have been saved.</Alert>
          {otherRequests.length > 0 && <OtherRequestsReminder others={otherRequests} />}
        </>
      )}
      {grants.length === 0 ? (
        <p>No supporting grants were submitted with this request.</p>
      ) : (
        grants.map((grant, index) => (
          <Grant
            key={grant.grantId}
            grant={grant}
            canEdit={canEdit}
            last={index === grants.length - 1}
            onEdit={() => editGrant(grant.grantId)}
          />
        ))
      )}
      {canEdit && effectiveRequestId != null && (
        <>
          <div className="mt-2">
            <Button type="button" onClick={() => toggleAddGrantModal()}>
              Add Supporting Grant
            </Button>
          </div>
          <GrantEditModal grantNumber={grantNumber} requestId={effectiveRequestId} />
          <AddGrantModal grantNumber={grantNumber} requestId={effectiveRequestId} />
        </>
      )}
    </>
  );
}
