import { useRef } from "react";
import { useProject, useRequest } from "./helpers/hooks";
import config from "./helpers/config";
import {
  formatArray,
  formatManagers,
  formatNumber,
  formatResource,
  getResourceUsagePercent,
  icon,
  parseResourceName,
  roundNumber,
  singularize,
} from "./helpers/utils";
import gridStyle from "../shared/Grid.module.scss";

import Select from "react-select";

import Alert from "../shared/Alert";
import Grid from "../shared/Grid";
import InfoTip from "../shared/InfoTip";
import InlineButton from "../shared/InlineButton";
import ResourcesDiagram from "./ResourcesDiagram";
import StatusBadge from "../shared/StatusBadge";
import BlurInput from "../shared/BlurInput";

export default function Resources({ requestId, grantNumber }) {
  const {
    request,
    addResource,
    openUsageDetailModal,
    resetResources,
    setResourceRequest,
    setResourcesReason,
    statuses,
    toggleActionsModal,
    toggleConfirmModal,
    toggleResourcesModal,
  } = useRequest(requestId, grantNumber);
  const { project } = useProject(
    grantNumber || (request && request.grantNumber)
  );
  const resourceSearch = useRef(null);
  const submitButton = useRef(null);
  if (!request || !project) return;
  const canExchange = "Exchange" in request.allowedActions;
  const canRenew = "Renewal" in request.allowedActions;
  const canSupplement = "Supplement" in request.allowedActions;
  const saving = request.exchangeStatus == statuses.pending;
  const saved = request.exchangeStatus == statuses.success;
  const error = request.exchangeStatus == statuses.error;
  const previous = request.exchangeActionId !== null;

  const resources = request.resources;
  const reason = request.resourcesReason;

  const resourcesMap = {};
  for (let res of resources) resourcesMap[res.resourceId] = res;

  const requestMore = () => {
    getResourceUsagePercent(request) >= 0.75
      ? toggleActionsModal()
      : toggleConfirmModal();
  };

  // Find unmet resource dependencies.
  const unmetDeps = [];
  for (let res of resources) {
    let missing = [];
    if (res.requested > 0) {
      for (let depId of res.requires || []) {
        let dep = resourcesMap[depId];
        if (!dep) continue;
        if (dep.requested > 0) {
          missing = [];
          break;
        }
        missing.push(dep);
      }
      if (missing.length)
        unmetDeps.push(
          <span key={res.resourceId}>
            {formatResource(res, { userGuide: false })} requires{" "}
            {formatArray(
              missing.map((res) => formatResource(res, { userGuide: false })),
              "or"
            )}
            .
          </span>
        );
    }
  }
  const hasUnmetDeps = unmetDeps.length > 0;

  let alert;
  if (saved)
    alert = (
      <Alert color="info">Your exchange request has been submitted.</Alert>
    );
  else if (previous)
    alert = (
      <Alert color="warning">
        You have an exchange request under review. The information below
        reflects the pending exchange request.
      </Alert>
    );
  else if (error)
    alert = (
      <Alert color="danger">
        Sorry, your exchange request could not be submitted. Please try again
        later.
      </Alert>
    );
  else if (request.timeStatus == "current" && !project.isManager)
    alert = (
      <Alert color="warning">
        You do not have permission to manage resources for this project. Please
        contact {formatManagers(project)} to request a change.
      </Alert>
    );
  else if (hasUnmetDeps)
    alert = (
      <Alert color="warning">
        {unmetDeps} Please adjust your balance values.
      </Alert>
    );

  const hasReason = reason.length > 0;
  let hasAddedResources = false;
  let hasRequested = false;

  for (let resource of resources) {
    if (resource.isNew) hasAddedResources = true;
    if (resource.allocated != resource.requested) hasRequested = true;
    if (hasAddedResources && hasRequested) break;
  }

  const resourceIds = resources.map((res) => res.resourceId);
  const availableResourceOptions =
    canExchange && !saved && !previous
      ? request.allowedActions.Exchange.resources
          .filter((res) => !resourceIds.includes(res.resourceId))
          .map((res) => {
            const parsed = parseResourceName(res.name);
            const label = parsed.short
              ? `${parsed.short} (${parsed.full.replace(/ \([^(]+\)/, "")})`
              : parsed.full;
            return { value: res.resourceId, label };
          })
      : [];
  const exchangeActionResourceIds = canExchange
    ? request.allowedActions.Exchange.resources.map((res) => res.resourceId)
    : [];

  let credit;

  // Grid rows
  const rows = [];
  const rowClasses = [];
  for (let res of resources) {
    if (res.isCredit) {
      credit = res;
    } else {
      rows.push(res);
      rowClasses.push(
        !saved && !previous && (res.isNew || res.allocated != res.requested)
          ? gridStyle.edited
          : exchangeActionResourceIds.includes(res.resourceId)
          ? ""
          : gridStyle.disabled
      );
    }
  }

  const resourceAddMessage = `Add ${
    rows.length ? "another" : "a"
  } resource to your exchange...`;

  const getBalance = (row) => row.requested - row.used;

  const getRequested = (balanceString, row) => {
    let requested = roundNumber(
      Number(balanceString.replace(/[^0-9-.]/g, "")) + row.used,
      row.decimalPlaces
    );
    if (isNaN(requested)) requested = row.allocated;

    const minRequest = Math.min(row.allocated, row.used);
    if (requested < minRequest) return minRequest;

    let cost = row.unitCost * (requested - row.requested);
    if (cost > credit.requested)
      return (
        roundNumber(
          credit.requested / row.unitCost,
          row.decimalPlaces,
          "floor"
        ) + row.requested
      );

    return requested;
  };

  // Grid columns
  const columns = [
    {
      key: "name",
      name: "Resource",
      format: (name, row) => formatResource(row),
      width: Math.min(350, window.innerWidth * 0.3),
    },
    {
      key: "isActive",
      name: "Status",
      format: (value, row) => (
        <StatusBadge
          status={value ? "Active" : row.isNew ? "New" : "Inactive"}
        />
      ),
      width: 100,
    },
    {
      key: "unit",
      name: "Unit",
      width: 150,
      format: (value, row) =>
        row.isBoolean ? (
          <>&mdash;</>
        ) : (
          <abbr
            title={`1 ${singularize(value, 1)} = ${formatNumber(
              row.unitCost
            )} ${singularize(credit.name, row.unitCost)}`}
          >
            {value}
          </abbr>
        ),
    },
    {
      key: "used",
      name: "Usage",
      class: "text-end",
      format: (value, row) =>
        row.isBoolean ? (
          <>&mdash;</>
        ) : (
          <>
            {formatNumber(value)}
            {(project.currentUser.resourceIds.includes(row.resourceId) ||
              project.currentUser.resourceAccountInactiveIds.includes(
                row.resourceId
              )) && (
              <InlineButton
                icon="table"
                onClick={() => openUsageDetailModal(row.resourceRepositoryKey)}
                target="_blank"
                title={`${row.name} Usage Details`}
              />
            )}
          </>
        ),
    },
  ];

  if (canExchange)
    columns.push({
      key: "requested",
      name: "Balance",
      class: "text-end",
      rowClass: (row) =>
        !saved &&
        !previous &&
        exchangeActionResourceIds.includes(row.resourceId)
          ? gridStyle.input
          : "",
      format: (value, row) => {
        const editable =
          !saved &&
          !previous &&
          exchangeActionResourceIds.includes(row.resourceId);
        return row.isBoolean ? (
          <input
            className="form-check-input"
            type="checkbox"
            checked={value == 1}
            disabled={!editable}
            onChange={(e) =>
              setResourceRequest(row.resourceId, e.target.checked ? 1 : 0)
            }
          />
        ) : editable ? (
          <BlurInput
            classes="text-end w-100"
            clean={(balanceString) => {
              const requested = getRequested(balanceString, row);
              return requested - row.used;
            }}
            format={formatNumber}
            label={`Balance for ${row.name}`}
            setValue={(cleaned) => {
              setResourceRequest(row.resourceId, cleaned + row.used);
            }}
            style={{ padding: "0.1rem 0.5rem" }}
            value={getBalance(row)}
          />
        ) : (
          formatNumber(getBalance(row))
        );
      },
      formatHeader: (name) => (
        <>
          {name}
          {!saved && !previous ? (
            <InfoTip
              bg="secondary"
              color="dark"
              initial="myprojects.requestedAllocation"
              placement="top-end"
              visible={project.tab == "resources"}
            >
              You can increase or decrease the balance below to change your
              allocation on a resource. Enter the total amount you would like to
              have available once the exchange is complete.
            </InfoTip>
          ) : null}
        </>
      ),
    });

  return (
    <div className="resources">
      {alert}
      {resources.length ? <ResourcesDiagram requestId={requestId} /> : null}
      {credit && (canExchange || canRenew || canSupplement) ? (
        <h2 className="mb-1 mt-2 d-flex justify-content-between">
          <span>
            {icon(config.resourceTypeIcons.credit)}{" "}
            {formatNumber(credit.requested, credit)} {credit.unit} available to
            exchange
          </span>
          {canRenew || canSupplement ? (
            <button
              type="button"
              className="btn btn-sm btn-primary ms-2"
              onClick={requestMore}
            >
              {icon(config.resourceTypeIcons.credit)} Request More{" "}
              {request.usesCredits ? "Credits" : "Units"}
            </button>
          ) : null}
        </h2>
      ) : null}

      {rows.length ? (
        <Grid
          columns={columns}
          rows={rows}
          rowClasses={rowClasses}
          classes={availableResourceOptions.length ? "mb-0" : ""}
          frozenColumns={2}
          minWidth="800px"
        />
      ) : (
        <div className="card p-2 text-bg-light p-3">
          This project does not have any resources.
        </div>
      )}
      {availableResourceOptions.length ? (
        <>
          <div
            className="p-2"
            style={{
              backgroundColor: "var(--teal-200)",
              border: "1px solid #cccccc",
              marginTop: "-1px",
            }}
            ref={resourceSearch}
          >
            <Select
              classNames={{ control: () => "react-select mb-1" }}
              options={availableResourceOptions}
              onChange={(option) => addResource(option.value)}
              placeholder={resourceAddMessage}
              value={null}
              aria-label={resourceAddMessage}
            />
          </div>
          {!rows.length ? (
            <InfoTip
              bg="secondary"
              color="dark"
              visible={project.tab == "resources"}
              initial={true}
              target={resourceSearch}
            >
              Ready to get started? Search for a resource to add it to your
              project.
            </InfoTip>
          ) : null}
          <p className="text-black-50" style={{ fontSize: "0.9rem" }}>
            Need help choosing a resource? Visit our{" "}
            <a href={config.routes.resources_path()}>Resource Catalog</a>.
          </p>
        </>
      ) : null}

      {canExchange && !saved && !previous ? (
        <>
          <div className="mb-3">
            <label htmlFor="resources-reason" className="form-label required">
              Please briefly explain how the requested resources and amounts
              will contribute to your research.
            </label>
            <textarea
              className="form-control"
              id="resources-reason"
              rows="2"
              value={reason}
              onChange={(e) => setResourcesReason(e.target.value)}
              style={{ minHeight: "3rem" }}
            ></textarea>
          </div>

          <div className="d-flex">
            <button
              type="button"
              className="btn btn-danger me-2"
              disabled={
                saving || (!hasRequested && !hasReason && !hasAddedResources)
              }
              onClick={resetResources}
            >
              Reset Form
            </button>
            <button
              ref={submitButton}
              type="button"
              className="btn btn-secondary"
              disabled={saving || !hasRequested || !hasReason || hasUnmetDeps}
              onClick={toggleResourcesModal}
            >
              {saving ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
          {hasRequested && !hasUnmetDeps ? (
            <InfoTip
              bg="secondary"
              color="dark"
              initial="myprojects.submitExchange"
              maxWidth="390px"
              placement="right"
              target={submitButton}
              visible={project.tab == "resources"}
            >
              When you are finished adding resources, enter a justification for
              the requested resources above. Then you can submit your exchange
              for approval.
            </InfoTip>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
