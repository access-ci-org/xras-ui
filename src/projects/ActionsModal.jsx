import React from "react";
import { useProject, useRequest } from "./helpers/hooks";
import { getResourceUsagePercent } from "../shared/helpers/utils";
import config from "../shared/helpers/config";

import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";

const ActionToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    className="btn btn-secondary d-flex flex-column justify-content-center flex-grow-1"
    href=""
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    <span className="dropdown-toggle">{children}</span>
  </a>
));

export default function ActionsModal({ requestId, grantNumber }) {
  const { request, toggleActionsModal } = useRequest(requestId, grantNumber);
  const { project } = useProject(grantNumber || request.grantNumber);

  if (!request || !project || request.error || project.error) return;

  const newActionPath = config.routes.request_action_path(requestId, "new");
  const renewalActions = !request.allowedActions.Renewal
    ? []
    : Array.isArray(request.allowedActions.Renewal)
    ? [...request.allowedActions.Renewal]
    : [request.allowedActions.Renewal];

  // Sort renewal actions by opportunity ID to make the order:
  // Explore, Discover, Accelerate.
  renewalActions.sort((a, b) => (a.opportunityId < b.opportunityId ? -1 : 1));

  const actions = [];

  // Retrieve % of used resource
  let usedPercent = getResourceUsagePercent(request);

  // Calculate number of days until the allocation end date
  const endDate = new Date(request.endDate);
  const currentDate = new Date();
  const daysUntilEndDate = Math.max(0, Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)));

  // Determine if upgrade action should be shown
  // TODO: Update threshold logic once the information is available
  let nextTier;
  let nextTierId;
  let upgradeAction;
  let upgradeAllowed;
  const renewalAllowed = "Renewal" in request.allowedActions;
  const supplementAllowed = "Supplement" in request.allowedActions;
  const upgradeEligible = !(renewalAllowed) && !(supplementAllowed);

  if (upgradeEligible) {
    const nextTierMap = { Explore: "Discover", Discover: "Accelerate", Accelerate: null };
    nextTier = nextTierMap[request.allocationType] || null;

    if (nextTier) {
      nextTierId = renewalActions.find(action => action.opportunityName.includes(nextTier)).opportunityId;
      const upgradable = ["Explore", "Discover", "Accelerate"];

      if (upgradable.includes(request.allocationType)) {
        if (daysUntilEndDate > 30) {
          const thresholds = { "Explore": .90, "Discover": .75, "Accelerate": .75 };
          const threshold = thresholds[request.allocationType];
          upgradeAllowed = usedPercent > threshold;
        }
      }
    }
  }

  if (upgradeAllowed) {
    upgradeAction =  {
      id: "upgrade",
      action: `${config.routes.renew_request_path(requestId)}?opportunity_id=${nextTierId}`,
      method: "post",
      isEnabled: true,
      button: "Request an Upgrade",
      enabled: (
          <p>
            Upgrade your {request.allocationType} project to {nextTier} by submitting an upgrade request.
          </p>
      )
    };
  }

  actions.push({
    id: "extension",
    action: `${newActionPath}?action_type=Extension`,
    isEnabled: "Extension" in request.allowedActions,
    button: "Request an Extension",
    enabled: request.usesCredits ? (
      <p>
        Need more time to use your current credits and allocations? You can
        extend your project's end date up to six months past your funding end
        date, or up to 12 months at a time for projects not supported by a
        funding award.
      </p>
    ) : (
      <p>
        Need more time to use your current allocations? A one-time extension
        can extend your project end date by up to six months.
      </p>
    ),
    disabled: (
      <p>
        Your project is not currently eligible for an extension of its end
        date.
        {request.usesCredits ? (
          <>
            {" "}
            Extensions can be requested starting 90 days before your project's
            current end date.
          </>
        ) : null}
      </p>
    ),
  });

  actions.push({
    id: "supplement",
    action: `${newActionPath}?action_type=Supplement`,
    isEnabled: "Supplement" in request.allowedActions,
    button: "Request a Supplement",
    enabled: request.usesCredits ? (
      <p>
        Need more credits to complete your project? Great news! Your{" "}
        {request.allocationType} project is eligible for a supplement of{" "}
        {
          {
            Explore: "200,000",
            Discover: "750,000",
            Accelerate: "1,500,000",
          }[request.allocationType]
        }{" "}
        additional ACCESS credits.
      </p>
    ) : (
      <p>
        Need more units to complete your research? Great news! Your{" "}
        {request.allocationType} project is eligible for a supplement of
        additional units.
      </p>
    ),
    disabled: (
      <p>
        Your project is not currently eligible for a supplement of additional{" "}
        {request.usesCredits ? "ACCESS Credits" : "units"}.
      </p>
    ),
  });

  actions.push({
    id: "renewal",
    action: renewalActions.map((action) => [
      action.opportunityName,
      `${config.routes.renew_request_path(requestId)}?opportunity_id=${
        action.opportunityId
      }`,
      "post",
    ]),
    isEnabled: renewalAllowed,
    button: "Request a Renewal",
    enabled: (
      <p>
        Your {request.allocationType} project can be renewed! The requirements
        for renewing your project depend on the{" "}
        <a href={config.routes.project_types_path()} target="_blank">
          new project type you select
        </a>
        .
      </p>
    ),
    disabled: (
      <p>
        Your project is not currently eligible for renewal.
        {request.usesCredits && (
          <>
            {" "}
            Renewals are available starting 30 days before the project's
            current end date.
          </>
        )}
        {request.isMaximize && (
          <>
            {" "}
            You can submit a renewal request to the Maximize ACCESS
            opportunity closest to your project&apos;s current end date.
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
      [
        "Open a Help Ticket",
        "https://support.access-ci.org/open-a-ticket",
        "get",
      ],
    ],
    isEnabled: true,
    button: "Request Help",
    enabled: (
      <p>
        Need to change something else about your project or expecting another
        option? Submit a help ticket that includes{" "}
        <em>grant number {project.grantNumber}</em> and a detailed description
        of the problem.
      </p>
    ),
  });

  if (upgradeAllowed) {
      actions.push(upgradeAction);
  }

  const rows = actions.map(
    ({ id, action, isEnabled, button, enabled, disabled, method }) => (
      <div className="row" key={id}>
        <div className="col-sm-4 mb-2 d-grid">
          {Array.isArray(action) && action.length && isEnabled ? (
            <Dropdown className="d-flex flex-column">
              <Dropdown.Toggle as={ActionToggle}>{button}</Dropdown.Toggle>
              <Dropdown.Menu>
                {action.map(([name, href, method]) => (
                  <Dropdown.Item
                    key={href}
                    href={href}
                    data-method={method}
                  >
                    {name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <a
              className={`btn btn-secondary d-flex flex-column justify-content-center ${
                isEnabled ? "" : "disabled"
              }`}
              href={isEnabled ? action : ""}
              data-method={method}
            >
              <span>{button}</span>
            </a>
          )}
        </div>
        <div className="col-sm-8 mb-2">{isEnabled ? enabled : disabled}</div>
      </div>
    )
  );

  return (
    <Modal
      size="lg"
      show={request.showActionsModal}
      onHide={toggleActionsModal}
    >
      <Modal.Header closeButton>
        <Modal.Title>Manage Your Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Please select an action to manage your project{" "}
          <strong>
            {project.grantNumber}: {project.title}
          </strong>
          .
        </p>
        {rows}
      </Modal.Body>
    </Modal>
  );
}
