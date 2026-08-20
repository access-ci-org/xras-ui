import { useRef } from "react";
import { useAtomValue } from "jotai";
import { Table } from "lucide-react";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import Alert from "../shared/Alert";
import Grid, { type GridColumn } from "../shared/Grid";
import InfoTip from "../shared/InfoTip";
import InlineButton from "../shared/InlineButton";
import ResourceName from "../shared/ResourceName";
import StatusBadge from "../shared/StatusBadge";
import BlurInput from "../shared/BlurInput";
import gridStyle from "../shared/Grid.module.scss";
import config from "../shared/helpers/config";
import { routesAtom } from "../shared/routes";
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
import ResourcesDiagram from "./ResourcesDiagram";
import { useProject, useRequest } from "./helpers/hooks";
import type { Resource } from "./types";

export default function Resources({
  requestId,
  grantNumber,
}: {
  requestId: number;
  grantNumber?: string;
}) {
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
  const { project } = useProject(grantNumber || request?.grantNumber);
  const resourceSearch = useRef<HTMLDivElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const routes = useAtomValue(routesAtom);
  if (!request || !project) return null;

  const exchangeAction = request.allowedActions.Exchange;
  const exchangeActionSingle = Array.isArray(exchangeAction) ? exchangeAction[0] : exchangeAction;

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

  const resourcesMap: Record<number, Resource> = {};
  for (const res of resources) resourcesMap[res.resourceId] = res;

  const requestMore = () => {
    if (getResourceUsagePercent(request) >= 0.75) toggleActionsModal();
    else toggleConfirmModal();
  };

  // Find unmet resource dependencies.
  const unmetDeps: React.ReactNode[] = [];
  for (const res of resources) {
    let missing: Resource[] = [];
    if (res.requested > 0) {
      for (const depId of res.requires || []) {
        const dep = resourcesMap[depId];
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
              missing.map((res) => <ResourceName key={res.resourceId} resource={res} userGuide={false} />),
              "or",
            )}
            .
          </span>,
        );
    }
  }
  const hasUnmetDeps = unmetDeps.length > 0;

  const getBalance = (row: Resource) => row.requested - row.used;
  const belowMinimum = (row: Resource) =>
    row.isNew && 0 < row.requested && row.requested < row.minimumExchange;
  const belowMinimums: React.ReactNode[] = [];
  for (const res of resources) {
    if (!res.isCredit && belowMinimum(res)) {
      belowMinimums.push(
        <span key={res.resourceId}>
          The minimum initial request for <ResourceName resource={res} userGuide={false} /> is{" "}
          {res.minimumExchange} {res.unit}. <br />
        </span>,
      );
    }
  }
  const anyBelowMinimum = belowMinimums.length > 0;

  let alert;
  if (saved) alert = <Alert color="info">Your exchange request has been submitted.</Alert>;
  else if (
    error &&
    errorMessages.length > 0 &&
    errorMessages[0].includes("PI") &&
    errorMessages[0].includes("person status Unknown")
  )
    alert = (
      <Alert color="danger">
        {project.currentUser?.role === "pi" ? (
          <>
            Please <a href={routes.profile_path()}>update your academic status</a> before making an
            exchange request.
          </>
        ) : (
          <>
            The primary investigator for this project has an unknown academic status. Please ask{" "}
            {project.users.filter((user) => user.role === "pi").map((user) => `${user.firstName} ${user.lastName}`)}{" "}
            to update the academic status in their profile, and then try again.
          </>
        )}
      </Alert>
    );
  else if (error)
    alert = (
      <Alert color="danger">
        Sorry, something went wrong: {errorMessages.join(", ")}. For assistance, please{" "}
        <a href="https://support.access-ci.org/open-a-ticket">open a help ticket</a> and include this
        message.
      </Alert>
    );
  else if (previous)
    alert = (
      <Alert color="warning">
        You have an exchange request under review. The information below reflects the pending exchange
        request.
      </Alert>
    );
  else if (request.timeStatus == "current" && !project.isManager)
    alert = (
      <Alert color="warning">
        You do not have permission to manage resources for this project. Please contact{" "}
        {formatManagers(project)} to request a change.
      </Alert>
    );
  else if (hasUnmetDeps)
    alert = <Alert color="warning">{unmetDeps} Please adjust your balance values.</Alert>;
  else if (anyBelowMinimum) alert = <Alert color="warning">{belowMinimums}</Alert>;

  const hasReason = reason.length > 0;
  let hasAddedResources = false;
  let hasRequested = false;

  for (const resource of resources) {
    if (resource.isNew) hasAddedResources = true;
    if (resource.allocated != resource.requested) hasRequested = true;
    if (hasAddedResources && hasRequested) break;
  }

  const resourceIds = resources.map((res) => res.resourceId);
  const availableResourcesMap: Record<number, Resource> = {};
  const groupedResourcesMap: Record<string, Resource[]> = {};
  const availableResourceGroups: { label: string; options: { value: number; label: string }[] }[] = [];
  if (canExchange && exchangeEditable && exchangeActionSingle) {
    exchangeActionSingle.resources
      .filter((res) => !resourceIds.includes(res.resourceId))
      .forEach((res) => {
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
            a.exchangeRates.current.unitCost < b.exchangeRates.current.unitCost ||
            (a.exchangeRates.current.unitCost == b.exchangeRates.current.unitCost && a.name < b.name)
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

  const exchangeActionResourceIds = canExchange && exchangeActionSingle
    ? exchangeActionSingle.resources.map((res) => res.resourceId)
    : [];

  let credit: Resource | undefined;

  // Grid rows
  const rows: Resource[] = [];
  const rowClasses: string[] = [];
  for (const res of resources) {
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

  const resourceAddMessage = `Add ${rows.length ? "another" : "a"} resource to your exchange...`;

  const cleanBalance = (balanceString: string, row: Resource) => {
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
    let availableCredits = (credit?.requested ?? 0) * (credit?.exchangeRates.base.unitCost ?? 0);
    const costToAllocated = (row.allocated - row.requested) * row.exchangeRates.base.unitCost;
    const baseCost = Math.min(availableCredits, costToAllocated);

    availableCredits -= baseCost;
    let maxBalance = row.requested - row.used + baseCost / row.exchangeRates.base.unitCost;
    if (availableCredits > 0) maxBalance += availableCredits / row.exchangeRates.current.unitCost;

    if (desiredBalance > maxBalance) return roundNumber(maxBalance, row.decimalPlaces, "floor");
    return desiredBalance;
  };

  const formatUnitCost = (resource: Resource) =>
    resource.isBoolean ? (
      <>&mdash;</>
    ) : (
      <>
        {credit && icon(config.resourceTypeIcons[credit.icon])}
        <span className="ml-2">
          {credit && formatExchangeRate(resource.unit, resource.exchangeRates.current.unitCost, credit.name)}
        </span>
      </>
    );

  // Grid columns
  const columns: GridColumn[] = [
    {
      key: "name",
      name: "Resource",
      format: (_name, row) => (
        <>
          <ResourceName resource={row as Resource} />
          {(project.currentUser?.resourceIds.includes((row as Resource).resourceId) ||
            project.currentUser?.resourceAccountInactiveIds.includes((row as Resource).resourceId)) && (
            <InlineButton
              icon={Table}
              onClick={() => openUsageDetailModal((row as Resource).resourceRepositoryKey ?? "")}
              target="_blank"
              title={`${(row as Resource).name} Usage Details`}
            />
          )}{" "}
          <StatusBadge
            status={(row as Resource).isActive ? "Active" : (row as Resource).isNew ? "New" : "Inactive"}
          />
        </>
      ),
      width: Math.min(350, window.innerWidth * 0.3),
    },
    {
      key: "unit",
      name: "Unit Cost",
      width: 300,
      format: (_value, row) => formatUnitCost(row as Resource),
    },
  ];

  if (canExchange)
    columns.push(
      {
        key: "requested",
        name: "Balance",
        class: "text-right",
        rowClass: (row) =>
          exchangeEditable && exchangeActionResourceIds.includes((row as Resource).resourceId)
            ? gridStyle.input
            : "",
        format: (value, row) => {
          const typedRow = row as Resource;
          const editable = exchangeEditable && exchangeActionResourceIds.includes(typedRow.resourceId);
          return typedRow.isBoolean ? (
            <span className="flex">
              <span className="w-full">
                <input
                  className="size-4"
                  type="checkbox"
                  checked={value == 1}
                  disabled={!editable}
                  onChange={(e) => setResourceRequest(typedRow.resourceId, e.target.checked ? 1 : 0)}
                />
              </span>
              <span className="w-32 ps-2 text-left">Requested</span>
            </span>
          ) : (
            <span className="flex">
              {editable ? (
                <BlurInput
                  classes="h-auto w-full rounded-none bg-background text-right"
                  clean={(balanceString) => cleanBalance(balanceString, typedRow).toString()}
                  format={(value) => formatNumber(Number(value))}
                  label={`Balance for ${typedRow.name}`}
                  setValue={(cleaned) => {
                    setResourceRequest(typedRow.resourceId, Number(cleaned) + typedRow.used);
                  }}
                  style={{ padding: "0.1rem 0.5rem" }}
                  value={getBalance(typedRow).toString()}
                />
              ) : (
                <span>{formatNumber(getBalance(typedRow))}</span>
              )}
              <span className="w-32 ps-2 text-left">{typedRow.unit}</span>
            </span>
          );
        },
        formatHeader: (name) => (
          <>
            {name}
            {exchangeEditable ? (
              <InfoTip
                variant="secondary"
                initial="myprojects.requestedAllocation"
                placement="top-end"
                visible={project.tab == "resources"}
              >
                You can increase or decrease the balance below to change your allocation on a resource.
                Enter the total amount you would like to have available once the exchange is complete.
              </InfoTip>
            ) : null}
          </>
        ),
      },
      {
        key: "change",
        name: "Credit Change",
        format: (_value, row) => {
          const typedRow = row as Resource;
          const transfer = typedRow.requested - typedRow.allocated;
          const cost = -1 * transfer * typedRow.exchangeRates.current.unitCost;
          return cost !== 0 ? (
            <span
              className={`inline-flex items-center whitespace-nowrap rounded-full px-[0.65em] py-[0.35em] text-[0.75em] font-bold leading-none text-white ${
                cost > 0 ? "bg-primary" : "bg-destructive"
              }`}
            >
              {cost > 0 ? "+" : ""}
              {formatNumber(cost, { decimalPlaces: credit?.decimalPlaces })} {credit?.unit}
            </span>
          ) : (
            <>&mdash;</>
          );
        },
      },
    );

  return (
    <div>
      {resources.length ? <ResourcesDiagram requestId={requestId} /> : null}
      {credit && (canExchange || canRenew || canSupplement) ? (
        <h2 className="mb-1 mt-2 flex items-center justify-between text-2xl font-bold">
          <span>
            {icon(config.resourceTypeIcons.credit)}{" "}
            {formatNumber(credit.requested, { decimalPlaces: credit.decimalPlaces })} {credit.unit} available
            to exchange
          </span>
          {canRenew || canSupplement ? (
            <Button type="button" size="sm" className="ml-2" onClick={requestMore}>
              {icon(config.resourceTypeIcons.credit)} Request More{" "}
              {request.usesCredits ? "Credits" : "Units"}
            </Button>
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
        <div className="rounded-md border bg-muted p-4">This project does not have any resources.</div>
      )}
      {availableResourceGroups.length ? (
        <>
          <div className="-mt-px border border-[#cccccc] bg-teal-200 p-2" ref={resourceSearch}>
            <Select
              classNames={{ control: () => "react-select mb-1" }}
              theme={(theme) => ({ ...theme, borderRadius: 0 })}
              options={availableResourceGroups}
              onChange={(option) => option && addResource(option.value)}
              placeholder={resourceAddMessage}
              value={null}
              aria-label={resourceAddMessage}
              formatOptionLabel={({ value, label }: { value: number; label: string }) => {
                const resource = availableResourcesMap[value];
                return (
                  <span className="flex justify-between">
                    <span>
                      <ResourceName key={label} resource={resource} userGuide={false} />
                    </span>
                    <span>{formatUnitCost(resource)}</span>
                  </span>
                );
              }}
            />
          </div>
          {!rows.length ? (
            <InfoTip
              variant="secondary"
              visible={project.tab == "resources"}
              initial={true}
              target={resourceSearch}
            >
              Ready to get started? Search for a resource to add it to your project.
            </InfoTip>
          ) : null}
          <p className="text-[0.9rem] text-black/50">
            Need help choosing a resource? Visit our{" "}
            <a className="font-bold" href={routes.resources_path()}>
              Resource Catalog
            </a>
            .
          </p>
        </>
      ) : null}

      {canExchange && exchangeEditable ? (
        <>
          <div className="mb-4">
            <label htmlFor="resources-reason" className="mb-2 inline-block font-bold">
              Please briefly explain how the requested resources and amounts will contribute to your
              research. <span className="text-destructive">*</span>
            </label>
            <textarea
              className="min-h-[3rem] w-full rounded-none border border-input bg-transparent px-3 py-1.5"
              id="resources-reason"
              rows={2}
              value={reason}
              onChange={(e) => setResourcesReason(e.target.value)}
            ></textarea>
          </div>

          <div className="flex">
            <Button
              type="button"
              variant="destructive"
              className="mr-2"
              disabled={saving || (!hasRequested && !hasReason && !hasAddedResources)}
              onClick={() => resetResources()}
            >
              Reset Form
            </Button>
            <Button
              ref={submitButton}
              type="button"
              variant="secondary"
              disabled={saving || !hasRequested || !hasReason || hasUnmetDeps || anyBelowMinimum}
              onClick={() => toggleResourcesModal()}
            >
              {saving ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
          {hasRequested && !hasUnmetDeps ? (
            <InfoTip
              variant="secondary"
              initial="myprojects.submitExchange"
              maxWidth="390px"
              placement="right"
              target={submitButton}
              visible={project.tab == "resources"}
            >
              When you are finished adding resources, enter a justification for the requested resources
              above. Then you can submit your exchange for approval.
            </InfoTip>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
