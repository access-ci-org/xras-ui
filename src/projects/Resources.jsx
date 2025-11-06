import { useRef } from "react";
import { useProject, useRequest } from "./helpers/hooks";
import config from "../shared/helpers/config";
import {
  formatArray,
  formatExchangeRate,
  formatManagers,
  formatNumber,
  getResourceUsagePercent,
  icon,
  parseResourceName,
  roundNumber,
} from "../shared/helpers/utils";
import gridStyle from "../shared/Grid.module.scss";

import Select from "react-select";

import Alert from "../shared/Alert";
import Grid from "../shared/Grid";
import InfoTip from "../shared/InfoTip";
import InlineButton from "../shared/InlineButton";
import ResourceName from "../shared/ResourceName";
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
    grantNumber || (request && request.grantNumber),
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
  const errorMessages = request.exchangeErrors;
  const previous = request.exchangeActionId !== null;
  const exchangeEditable = request.exchangeActionEditable;

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
            <ResourceName resource={res} userGuide={false} /> requires{" "}
            {formatArray(
              missing.map((res) => (
                <ResourceName
                  key={res.resourceId}
                  resource={res}
                  userGuide={false}
                />
              )),
              "or",
            )}
            .
          </span>,
        );
    }
  }
  const hasUnmetDeps = unmetDeps.length > 0;

  const getBalance = (row) => row.requested - row.used;
  const belowMinimum = (row) => row.isNew && (0 < row.requested) && (row.requested < row.minimumExchange);
  const belowMinimums = [];
  for (let res of resources) {
    if (!res.isCredit && belowMinimum(res)) {
      belowMinimums.push(
	<span key={res.resourceId}>
	  The minimum initial request for <ResourceName resource={res} userGuide={false} /> is { res.minimumExchange } {res.unit}. <br />
	</span>,
      );
    }
  }
  const anyBelowMinimum = belowMinimums.length > 0;

  let alert;
  if (saved)
    alert = (
      <Alert color="info">Your exchange request has been submitted.</Alert>
    );
  else if (
    error &&
    errorMessages.length > 0 &&
    errorMessages[0].includes("PI") &&
    errorMessages[0].includes("person status Unknown")
  )
    alert = (
      <Alert color="danger">
        {project.currentUser.role === "pi" ? (
          <>
            Please{" "}
            <a href={config.routes.profile_path()}>
              update your academic status
            </a>{" "}
            before making an exchange request.
          </>
        ) : (
          <>
            The primary investigator for this project has an unknown academic
            status. Please ask{" "}
            {project.users
              .filter((user) => user.role === "pi")
              .map((user) => `${user.firstName} ${user.lastName}`)}{" "}
            to update the academic status in their profile, and then try again.
          </>
        )}
      </Alert>
    );
  else if (error)
    alert = (
      <Alert color="danger">
        Sorry, something went wrong: {errorMessages.join(", ")}. For assistance,
        please{" "}
        <a href="https://support.access-ci.org/open-a-ticket">
          open a help ticket
        </a>{" "}
        and include this message.
      </Alert>
    );
  else if (previous)
    alert = (
      <Alert color="warning">
        You have an exchange request under review. The information below
        reflects the pending exchange request.
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
  else if (anyBelowMinimum)
    alert = (
      <Alert color="warning">
	{belowMinimums}
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
  const availableResourcesMap = {};
  const groupedResourcesMap = {};
  const availableResourceGroups = [];
  if (canExchange && exchangeEditable) {
    request.allowedActions.Exchange.resources
      .filter((res) => !resourceIds.includes(res.resourceId))
      .map((res) => {
        availableResourcesMap[res.resourceId] = res;
        const groupLabel = `${res.type} Resources (${res.unit})`;
        groupedResourcesMap[groupLabel] = groupedResourcesMap[groupLabel] || [];
        groupedResourcesMap[groupLabel].push(res);
      });

    for (const [label, options] of Object.entries(groupedResourcesMap)) {
      availableResourceGroups.push({
        label,
        options: options
          .sort((a, b) =>
            a.exchangeRates.current.unitCost <
              b.exchangeRates.current.unitCost ||
            (a.exchangeRates.current.unitCost ==
              b.exchangeRates.current.unitCost &&
              a.name < b.name)
              ? -1
              : 1,
          )
          .map((res) => {
            const parsed = parseResourceName(res.name);
            const label = parsed.short
              ? `${parsed.short} (${parsed.full.replace(/ \([^(]+\)/, "")})`
              : parsed.full;
            return { value: res.resourceId, label };
          }),
      });
      availableResourceGroups.sort((a, b) => (a.label < b.label ? -1 : 1));
    }
  }

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
        exchangeEditable && (res.isNew || res.allocated != res.requested)
          ? gridStyle.edited
          : exchangeActionResourceIds.includes(res.resourceId)
            ? ""
            : gridStyle.disabled,
      );
    }
  }

  const resourceAddMessage = `Add ${
    rows.length ? "another" : "a"
  } resource to your exchange...`;

  const cleanBalance = (balanceString, row) => {
    const allocatedBalance = row.allocated - row.used;
    const desiredBalance = roundNumber(
      Number(balanceString.replace(/[^0-9-.]/g, "")),
      row.decimalPlaces,
    );
    const minBalance = Math.min(0, allocatedBalance);
    if (desiredBalance < minBalance) return minBalance;

    // We use the base exchange rate when the allocation is being reduced below the
    // current allocation, and the current exchange rate when the allocations is
    // being increased above the current allocation. To handle cases where the user
    // reduces the allocation and then later increases it before submitting, we need
    // to split the increase at the current allocation and apply the base exchange rate
    // to the lower portion and the current exchange rate to the upper portion.
    let availableCredits =
      credit.requested * credit.exchangeRates.base.unitCost;
    const costToAllocated =
      (row.allocated - row.requested) * row.exchangeRates.base.unitCost;
    const baseCost = Math.min(availableCredits, costToAllocated);

    availableCredits -= baseCost;
    let maxBalance =
      row.requested - row.used + baseCost / row.exchangeRates.base.unitCost;
    if (availableCredits > 0)
      maxBalance += availableCredits / row.exchangeRates.current.unitCost;

    if (desiredBalance > maxBalance)
      return roundNumber(maxBalance, row.decimalPlaces, "floor");
    return desiredBalance;
  };

  const formatUnitCost = (resource) =>
    resource.isBoolean ? (
      <>&mdash;</>
    ) : (
      <>
        {icon(config.resourceTypeIcons[credit.icon])}
        <span className="ms-2">
          {formatExchangeRate(
            resource.unit,
            resource.exchangeRates.current.unitCost,
            credit.name,
          )}
        </span>
      </>
    );

  // Grid columns
  const columns = [
    {
      key: "name",
      name: "Resource",
      format: (name, row) => (
        <>
          <ResourceName resource={row} />
          {(project.currentUser.resourceIds.includes(row.resourceId) ||
            project.currentUser.resourceAccountInactiveIds.includes(
              row.resourceId,
            )) && (
            <InlineButton
              icon="table"
              onClick={() => openUsageDetailModal(row.resourceRepositoryKey)}
              target="_blank"
              title={`${row.name} Usage Details`}
            />
          )}{" "}
          <StatusBadge
            status={row.isActive ? "Active" : row.isNew ? "New" : "Inactive"}
          />
        </>
      ),
      width: Math.min(350, window.innerWidth * 0.3),
    },
    {
      key: "unit",
      name: "Unit Cost",
      width: 300,
      format: (value, row) => formatUnitCost(row),
    },
  ];

  if (canExchange)
    columns.push(
      {
        key: "requested",
        name: "Balance",
        class: "text-end",
        rowClass: (row) =>
          exchangeEditable && exchangeActionResourceIds.includes(row.resourceId)
            ? gridStyle.input
            : "",
        format: (value, row) => {
          const editable =
            exchangeEditable &&
            exchangeActionResourceIds.includes(row.resourceId);
          return row.isBoolean ? (
            <span className="d-flex">
              <span className="w-100">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={value == 1}
                  disabled={!editable}
                  onChange={(e) =>
                    setResourceRequest(row.resourceId, e.target.checked ? 1 : 0)
                  }
                />
              </span>
              <span className="text-start ps-2" style={{ width: "8rem" }}>
                Requested
              </span>
            </span>
          ) : (
            <span className="d-flex">
              {editable ? (
                <BlurInput
                  classes="text-end w-100"
                  clean={(balanceString) => cleanBalance(balanceString, row)}
                  format={formatNumber}
                  label={`Balance for ${row.name}`}
                  setValue={(cleaned) => {
                    setResourceRequest(row.resourceId, cleaned + row.used);
                  }}
                  style={{ padding: "0.1rem 0.5rem" }}
                  value={getBalance(row)}
                />
              ) : (
                <span>{formatNumber(getBalance(row))}</span>
              )}
              <span className="text-start ps-2" style={{ width: "8rem" }}>
                {row.unit}
              </span>
            </span>
          );
        },
        formatHeader: (name) => (
          <>
            {name}
            {exchangeEditable ? (
              <InfoTip
                bg="secondary"
                color="dark"
                initial="myprojects.requestedAllocation"
                placement="top-end"
                visible={project.tab == "resources"}
              >
                You can increase or decrease the balance below to change your
                allocation on a resource. Enter the total amount you would like
                to have available once the exchange is complete.
              </InfoTip>
            ) : null}
          </>
        ),
      },
      {
        key: "change",
        name: "Credit Change",
        format: (value, row) => {
          const transfer = row.requested - row.allocated;
          const cost = -1 * transfer * row.exchangeRates.current.unitCost;
          return cost !== 0 ? (
            <span
              className={`badge bg-${
                cost > 0 ? "primary" : "danger"
              } rounded-pill`}
            >
              {cost > 0 ? "+" : ""}
              {formatNumber(cost, credit)} {credit.unit}
            </span>
          ) : (
            <>&mdash;</>
          );
        },
      },
    );

  return (
    <div className="resources">
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
      {alert}

      {rows.length ? (
        <Grid
          columns={columns}
          rows={rows}
          rowClasses={rowClasses}
          classes={availableResourceGroups.length ? "mb-0" : ""}
          frozenColumns={2}
          minWidth="800px"
        />
      ) : (
        <div className="card p-2 text-bg-light p-3">
          This project does not have any resources.
        </div>
      )}
      {availableResourceGroups.length ? (
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
              options={availableResourceGroups}
              onChange={(option) => addResource(option.value)}
              placeholder={resourceAddMessage}
              value={null}
              aria-label={resourceAddMessage}
              formatOptionLabel={({ value, label }) => {
                const resource = availableResourcesMap[value];
                return (
                  <span className="d-flex justify-content-between">
                    <span>
                      <ResourceName
                        key={label}
                        resource={resource}
                        userGuide={false}
                      />
                    </span>
                    <span>{formatUnitCost(resource)}</span>
                  </span>
                );
              }}
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

      {canExchange && exchangeEditable ? (
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
              disabled={saving || !hasRequested || !hasReason || hasUnmetDeps || anyBelowMinimum}
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
