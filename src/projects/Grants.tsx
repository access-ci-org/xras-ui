import Alert from "../shared/Alert";
import Grant from "./Grant";
import GrantEditModal from "./GrantEditModal";
import { useProject, useRequest } from "./helpers/hooks";

// Managers may edit begin/end date and program officer name/email; everything
// else on a grant is read-only here (see GRANT_EDITABLE_FIELDS in atoms.ts,
// enforced again server-side by save_grants in xras_submit_access).
const MANAGER_ROLES = ["pi", "co_pi", "allocation_manager"];

export default function Grants({ grantNumber, requestId }: { grantNumber: string; requestId?: number }) {
  const { project } = useProject(grantNumber);
  const effectiveRequestId = requestId ?? project?.currentRequestId ?? undefined;
  const { request, editGrant, statuses } = useRequest(effectiveRequestId, grantNumber);

  if (!project || !request || project.error || request.error) return null;

  // `undefined` (as opposed to `[]`) means the host API predates the projects
  // payload carrying grants at all - see the Grant/Request type comments.
  // Request.tsx already gates the tab on this, but this component can be
  // (and is, in tests) rendered on its own, so it repeats the guard.
  const grants = request.grants;
  if (grants === undefined) return null;

  // Only the current request's grants are editable: an older request's grants
  // describe a period that has already been reviewed.
  const canEdit =
    MANAGER_ROLES.includes(project.currentUser?.role ?? "") &&
    effectiveRequestId == project.currentRequestId;

  return (
    <>
      {/* A failed save leaves its errors in the still-open modal, so only the
          success case has anything to report out here. */}
      {request.grantsStatus == statuses.success && (
        <Alert color="info">Your changes have been saved.</Alert>
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
        <GrantEditModal grantNumber={grantNumber} requestId={effectiveRequestId} />
      )}
    </>
  );
}
