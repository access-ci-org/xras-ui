import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import config from "../shared/helpers/config";
import { getUpgrade } from "./helpers/upgrades";
import { useProject, useRequest } from "./helpers/hooks";
import type { AllowedAction } from "./types";

type DropdownAction = [string, string, string];

type ActionSpec = {
  id: string;
  action: string | DropdownAction[];
  isEnabled: boolean;
  button: string;
  enabled: ReactNode;
  disabled?: ReactNode;
  method?: string;
};

export default function ActionsModal({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber: string;
}) {
  const { request, toggleActionsModal } = useRequest(requestId, grantNumber);
  const { project } = useProject(grantNumber || request?.grantNumber);

  if (!request || !project || request.error || project.error) return null;

  const newActionPath = config.routes.request_action_path(requestId, "new");
  const renewalAction = request.allowedActions.Renewal;
  const renewalActions: AllowedAction[] = !renewalAction
    ? []
    : Array.isArray(renewalAction)
      ? [...renewalAction]
      : [renewalAction];

  // Sort renewal actions by opportunity ID to make the order:
  // Explore, Discover, Accelerate.
  renewalActions.sort((a, b) => ((a.opportunityId ?? 0) < (b.opportunityId ?? 0) ? -1 : 1));

  const actions: ActionSpec[] = [];
  const upgrade = getUpgrade(request, renewalActions);

  actions.push({
    id: "extension",
    action: `${newActionPath}?action_type=Extension`,
    isEnabled: "Extension" in request.allowedActions,
    button: "Request an Extension",
    enabled: request.usesCredits ? (
      <p>
        Need more time to use your current credits and allocations? You can extend your project&apos;s end
        date up to six months past your funding end date, or up to 12 months at a time for projects not
        supported by a funding award.
      </p>
    ) : (
      <p>
        Need more time to use your current allocations? A one-time extension can extend your project end
        date by up to six months.
      </p>
    ),
    disabled: (
      <p>
        Your project is not currently eligible for an extension of its end date.
        {request.usesCredits ? (
          <> Extensions can be requested starting 90 days before your project&apos;s current end date.</>
        ) : null}
      </p>
    ),
  });

  if (upgrade.isEnabled) {
    actions.push({
      id: "upgrade",
      action: `${config.routes.renew_request_path(requestId)}?opportunity_id=${upgrade.opportunityId}`,
      method: "post",
      isEnabled: true,
      button: "Request an upgrade",
      enabled: (
        <p>
          Running low on credits well before your project&apos;s end date? You could be ready for the next
          level. Upgrade your {request.allocationType} allocation to {upgrade.allocationType}!
        </p>
      ),
    });
  } else {
    actions.push({
      id: "supplement",
      action: `${newActionPath}?action_type=Supplement`,
      isEnabled: "Supplement" in request.allowedActions,
      button: "Request a Supplement",
      enabled: request.usesCredits ? (
        <p>
          Need more credits to complete your project? Great news! Your {request.allocationType} project
          is eligible for a supplement of{" "}
          {
            (
              {
                Explore: "200,000",
                Discover: "750,000",
                Accelerate: "1,500,000",
              } as Record<string, string>
            )[request.allocationType]
          }{" "}
          additional ACCESS credits.
        </p>
      ) : (
        <p>
          Need more units to complete your research? Great news! Your {request.allocationType} project is
          eligible for a supplement of additional units.
        </p>
      ),
      disabled: (
        <p>
          Your project is not currently eligible for a supplement of additional{" "}
          {request.usesCredits ? "ACCESS Credits" : "units"}.
        </p>
      ),
    });
  }

  actions.push({
    id: "renewal",
    action: renewalActions.map(
      (action): DropdownAction => [
        action.opportunityName ?? "",
        `${config.routes.renew_request_path(requestId)}?opportunity_id=${action.opportunityId}`,
        "post",
      ],
    ),
    isEnabled: !!upgrade.isRenewalEnabled,
    button: "Request a Renewal",
    enabled: (
      <p>
        Your {request.allocationType} project can be renewed! The requirements for renewing your project
        depend on the{" "}
        <a href={config.routes.project_types_path()} target="_blank" rel="noreferrer">
          new project type you select
        </a>
        .
      </p>
    ),
    disabled: (
      <p>
        Your project is not currently eligible for renewal.
        {request.usesCredits && (
          <> Renewals are available starting 30 days before the project&apos;s current end date.</>
        )}
        {request.isMaximize && (
          <>
            {" "}
            You can submit a renewal request to the Maximize ACCESS opportunity closest to your
            project&apos;s current end date.
          </>
        )}
      </p>
    ),
  });

  actions.sort((a, b) => (a.isEnabled < b.isEnabled ? 1 : -1));

  // Put the help option at the bottom.
  actions.push({
    id: "help",
    action: [
      ["Learn How to Manage Allocations", config.routes.how_to_path(), "get"],
      ["Open a Help Ticket", "https://support.access-ci.org/open-a-ticket", "get"],
    ],
    isEnabled: true,
    button: "Request Help",
    enabled: (
      <p>
        Need to change something else about your project or expecting another option? Submit a help
        ticket that includes <em>grant number {project.grantNumber}</em> and a detailed description of
        the problem.
      </p>
    ),
  });

  const rows = actions.map(({ id, action, isEnabled, button, enabled, disabled, method }) => (
    <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3" key={id}>
      <div className="flex sm:col-span-1">
        {Array.isArray(action) && action.length && isEnabled ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex grow flex-col justify-center rounded-none bg-muted px-4 py-3 text-center font-bold uppercase"
              >
                <span>{button}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {action.map(([name, href, itemMethod]) => (
                <DropdownMenuItem key={href} asChild>
                  <a href={href} data-method={itemMethod}>
                    {name}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <a
            className={`flex grow flex-col justify-center rounded-none bg-muted px-4 py-3 text-center font-bold uppercase ${
              isEnabled ? "" : "pointer-events-none opacity-50"
            }`}
            href={isEnabled ? (action as string) : ""}
            data-method={method}
          >
            <span>{button}</span>
          </a>
        )}
      </div>
      <div className="mb-2 sm:col-span-2">{isEnabled ? enabled : disabled}</div>
    </div>
  ));

  return (
    <Dialog open={request.showActionsModal} onOpenChange={() => toggleActionsModal()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Your Project</DialogTitle>
        </DialogHeader>
        <p>
          Please select an action to manage your project{" "}
          <strong>
            {project.grantNumber}: {project.title}
          </strong>
          .
        </p>
        {rows}
      </DialogContent>
    </Dialog>
  );
}
