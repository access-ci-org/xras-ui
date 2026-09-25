import { useAtomValue } from "jotai";

import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "../shared/helpers/utils";
import { routesAtom } from "../shared/routes";
import type { InternationalUserRequestSummary, Project } from "./types";

// A justification the user can still act on. "Submitted" is editable too: the
// form is only frozen once the Allocations Team has picked it up.
const isEditable = (status: string) => status == "Incomplete" || status == "Submitted";

export default function InternationalUserRequest({
  project,
  requestId,
}: {
  project: Project;
  requestId: number;
}) {
  const routes = useAtomValue(routesAtom);
  const requests = project.internationalUserRequests;
  if (!requests) return null;

  const link = (req: InternationalUserRequestSummary) => {
    const canEdit = isEditable(req.status);
    const path = canEdit
      ? routes.edit_request_international_user_request_path
      : routes.request_international_user_request_path;
    /*
     * Prefer the justification's own `requestId`, falling back to the request
     * being viewed. Current hosts send one, but older ones don't (see
     * `InternationalUserRequestSummary`) - and these are Rails route helpers,
     * so calling one with an undefined id doesn't produce a broken link, it
     * throws `ParametersMissing` out of js-routes and takes the whole tab's
     * render with it. Hence a guard rather than a bad href: the fallback is
     * correct whenever a project's justifications belong to the request whose
     * page they are shown on, which is the only shape the host can produce
     * anyway - `add_international_user_requests` assigns
     * `internationalUserRequests` to the *project* from inside a loop over its
     * requests, so a project with justifications on two requests keeps only the
     * last request's list.
     */
    return (
      <a
        href={path(req.requestId ?? requestId, req.id)}
        className={buttonVariants({ size: "sm" })}
      >
        {canEdit ? "View / Update" : "View"}
      </a>
    );
  };

  return (
    <div>
      <h2 className="mb-1 mt-2 text-2xl font-bold">International User Justifications</h2>
      <table className="mb-4 w-full">
        <thead>
          <tr>
            <th className="border-b p-2 text-left font-bold text-black">Status</th>
            <th className="border-b p-2 text-left font-bold text-black">Submitted On</th>
            <th className="border-b p-2"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td className="border-b p-2">{req.status}</td>
              {/*
                `submittedAt` is a full timestamp; every other date in this
                feature is rendered from its date part in local time (see
                `formatDate`/`parseDate`), so a submission just before midnight
                UTC doesn't display as the next day.
              */}
              <td className="border-b p-2">
                {req.submittedAt ? formatDate(String(req.submittedAt).split("T")[0]) : "—"}
              </td>
              <td className="border-b p-2 text-right">{link(req)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
