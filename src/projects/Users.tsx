import AsyncSelect from "react-select/async";
import { OctagonAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Alert from "../shared/Alert";
import Grid, { type GridColumn } from "../shared/Grid";
import MultiStateCheckbox from "../shared/MultiStateCheckbox";
import ResourceName from "../shared/ResourceName";
import UserName from "../shared/UserName";
import gridStyle from "../shared/Grid.module.scss";
import config from "../shared/helpers/config";
import { formatManagers, roles } from "../shared/helpers/utils";
import { filterResource, searchUsers } from "./atoms";
import { useProject, useRequest } from "./helpers/hooks";
import type { SearchedUser } from "./types";

export default function Users({ grantNumber, requestId }: { grantNumber: string; requestId?: number }) {
  const {
    project,
    addUser,
    resetUsers,
    saveUsers,
    setTab,
    setUserRole,
    statuses,
    toggleUsersResources,
  } = useProject(grantNumber);
  const { request } = useRequest(requestId || project?.currentRequestId, grantNumber);

  if (!project || !project.currentRequestId || !request || project.error || request.error) return null;

  const canManageUsers = project.isManager;
  const canExchange = "Exchange" in request.allowedActions;

  const saving = project.usersStatus == statuses.pending;
  const saved = project.usersStatus == statuses.success;
  const error = project.usersStatus == statuses.error;

  const users = project.users;
  const resources = request.resources.filter(filterResource);
  const allInactive = resources.length == 0;
  const hasChanges = users.find((user) => user.hasChanges) !== undefined;
  const hasNonPIUsers = users.find((user) => user.role != "pi") !== undefined;

  let alert;
  if (saved && !hasChanges) {
    alert = (
      <Alert color="info">
        Your changes have been saved. Creation of user accounts can take some time. Users can check the
        status of their accounts on the Overview tab of the My Projects page.
      </Alert>
    );
  } else if (error) {
    alert = (
      <Alert color="danger">
        Sorry, some of your changes could not be saved.
        {project.usersErrors && project.usersErrors.length > 0 && (
          <ul className="mb-0">
            {project.usersErrors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
      </Alert>
    );
  } else if (!canManageUsers) {
    alert = (
      <Alert color="warning">
        You do not have permission to manage users for this project. Please contact{" "}
        {formatManagers(project)} to request a change.
      </Alert>
    );
  } else if (!resources.length) {
    alert = (
      <Alert color="warning">
        This project does not have any resources.{" "}
        {canExchange ? (
          <a
            href={config.routes.request_action_path(request.requestId, "new?action_type=Exchange")}
            onClick={(e) => {
              e.preventDefault();
              setTab("resources");
            }}
          >
            Exchange credits for resources.
          </a>
        ) : null}{" "}
        Additional users can be added after an exchange is approved.
      </Alert>
    );
  } else if (allInactive) {
    alert = <Alert color="warning">This project does not have any active resources.</Alert>;
  }

  const formatHeader = (name: React.ReactNode, column: GridColumn) => {
    let description, onChange, selectedLength, totalLength;
    if (column.key == "all") {
      description = "all resources for all users";
      onChange = (checked: boolean) => toggleUsersResources(checked);
      selectedLength = 0;
      for (const user of users) selectedLength += user.resourceIds.length;
      totalLength = users.length * resources.length;
    } else {
      description = `all users for ${column.name}`;
      const resourceId = Number(column.key);
      onChange = (checked: boolean) => toggleUsersResources(checked, null, resourceId);
      selectedLength = users.filter(({ resourceIds }) => resourceIds.includes(resourceId)).length;
      totalLength = users.length;
    }

    return (
      <>
        {column.key == "all" ? name : <ResourceName resource={column as any} userGuide={false} />}
        <br />
        <MultiStateCheckbox
          description={description}
          disabled={(column as any).disabled}
          onChange={onChange}
          selectedLength={selectedLength}
          totalLength={totalLength}
        />
      </>
    );
  };

  const roleOptions = roles.map(({ role, name }) => (
    <option key={role} value={role}>
      {name}
    </option>
  ));

  const columns: GridColumn[] = [
    {
      key: "name",
      name: "Name",
      width: 200,
      format: (_value, row) => <UserName user={row as any} />,
    },
    { key: "username", name: "ACCESS Username", width: 100 },
    {
      key: "role",
      name: "Role",
      width: 100,
      format: (value, row) => (
        <select
          className="select-caret absolute inset-0 truncate border-0 bg-transparent px-3 py-1.5 disabled:bg-[#e9ecef]"
          value={value}
          onChange={(e) => setUserRole(row.username, e.target.value)}
          disabled={!canManageUsers || value == "pi" || value == "co_pi"}
        >
          {roleOptions.filter(
            (option) => option.key == value || !["pi", "co_pi"].includes(option.key as string),
          )}
        </select>
      ),
    },
  ];

  if (resources.length)
    columns.push({
      key: "all",
      name: "All Resources",
      class: `text-center ${gridStyle.important}`,
      disabled: !canManageUsers || allInactive,
      width: 100,
      format: (_value, row) => (
        <MultiStateCheckbox
          description={`all users for ${row.name}`}
          disabled={!canManageUsers || allInactive}
          onChange={(checked) => toggleUsersResources(checked, row.username)}
          selectedLength={row.resourceIds.length}
          totalLength={resources.length}
        />
      ),
      formatHeader,
    });

  for (const resource of resources)
    columns.push({
      key: resource.resourceId.toString(),
      name: resource.name,
      class: "text-center",
      disabled: !canManageUsers || !resource.isActive,
      icon: resource.icon,
      format: (_value, row) => (
        <input
          className="size-4"
          disabled={!canManageUsers || !resource.isActive}
          onChange={(e) => toggleUsersResources(e.target.checked, row.username, resource.resourceId)}
          type="checkbox"
          checked={row.resourceIds.includes(resource.resourceId)}
        />
      ),
      formatHeader,
    });

  const rowClasses = users.map((user) => (user.hasChanges ? gridStyle.edited : ""));

  return (
    <>
      {alert}
      <Grid
        rows={users}
        columns={columns}
        frozenColumns={resources.length ? 4 : 3}
        classes="mb-0"
        minWidth="800px"
        rowClasses={rowClasses}
        scrollRowIndex={project.usersNewRowIndex}
      />
      {canManageUsers && resources.length && !allInactive ? (
        <div className="relative -mt-px" style={{ zIndex: 100 }}>
          <AsyncSelect<{ label: React.ReactNode; value: SearchedUser }>
            classNames={{ control: () => "react-select" }}
            theme={(theme) => ({ ...theme, borderRadius: 0 })}
            loadOptions={async (value) => {
              const found = await searchUsers(value);
              return found.map((user) => ({
                isDisabled: user.eligibility === "no",
                label: (
                  <span className="flex justify-between">
                    <span
                      className={user.eligibility === "no" ? "text-[#707070] line-through" : ""}
                    >
                      {user.username} ({user.firstName} {user.lastName}, {user.organization}
                      {user.email ? `, ${user.email}` : ""}
                    </span>
                    {user.eligibility === "no" && user.eligibilityReason && (
                      <span className="ml-2 text-destructive">
                        <OctagonAlert className="inline size-4" /> {user.eligibilityReason}
                      </span>
                    )}
                  </span>
                ),
                value: user,
              }));
            }}
            onChange={(option) => option && addUser(option.value)}
            placeholder="Add another user..."
            value={null}
            aria-label="Add another user"
          />
        </div>
      ) : null}
      {canManageUsers && ((resources.length && !allInactive) || hasNonPIUsers) ? (
        <div className="mt-4 flex">
          <Button
            type="button"
            variant="destructive"
            className="mr-2"
            disabled={saving || !hasChanges}
            onClick={() => resetUsers()}
          >
            Reset Form
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving || !hasChanges}
            onClick={() => saveUsers()}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
