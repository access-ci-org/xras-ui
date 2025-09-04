import { filterResource, searchUsers } from "./helpers/apiSlice";
import { useProject, useRequest } from "./helpers/hooks";
import { formatManagers, roles } from "../shared/helpers/utils";
import config from "../shared/helpers/config";
import gridStyle from "../shared/Grid.module.scss";

import AsyncSelect from "react-select/async";

import Alert from "../shared/Alert";
import Grid from "../shared/Grid";
import MultiStateCheckbox from "../shared/MultiStateCheckbox";
import ResourceName from "../shared/ResourceName";
import UserName from "../shared/UserName";

export default function Users({ grantNumber, requestId }) {
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
  const { request } = project
    ? useRequest(requestId || project.currentRequestId, grantNumber)
    : { request: null };
  if (
    !project ||
    !project.currentRequestId ||
    !request ||
    project.error ||
    request.error
  )
    return;

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
        Your changes have been saved. Creation of user accounts can take some
        time. Users can check the status of their accounts on the Overview tab
        of the My Projects page.
      </Alert>
    );
  } else if (error) {
    alert = (
      <Alert color="danger">
        Sorry, your changes could not be saved. Please try again later.
      </Alert>
    );
  } else if (!canManageUsers) {
    alert = (
      <Alert color="warning">
        You do not have permission to manage users for this project. Please
        contact {formatManagers(project)} to request a change.
      </Alert>
    );
  } else if (!resources.length) {
    alert = (
      <Alert color="warning">
        This project does not have any resources.{" "}
        {canExchange ? (
          <a
            href={config.routes.request_action_path(
              request.requestId,
              "new?action_type=Exchange",
            )}
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
    alert = (
      <Alert color="warning">
        This project does not have any active resources.
      </Alert>
    );
  }

  const formatHeader = (name, column) => {
    let description, onChange, selectedLength, totalLength;
    if (column.key == "all") {
      description = "all resources for all users";
      onChange = (checked) => toggleUsersResources(checked);
      selectedLength = 0;
      for (let user of users) selectedLength += user.resourceIds.length;
      totalLength = users.length * resources.length;
    } else {
      description = `all users for ${column.name}`;
      onChange = (checked) => toggleUsersResources(checked, null, column.key);
      selectedLength = users.filter(({ resourceIds }) =>
        resourceIds.includes(column.key),
      ).length;
      totalLength = users.length;
    }

    return (
      <>
        {column.key == "all" ? (
          name
        ) : (
          <ResourceName resource={column} userGuide={false} />
        )}
        <br />
        <MultiStateCheckbox
          description={description}
          disabled={column.disabled}
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

  const columns = [
    {
      key: "name",
      name: "Name",
      width: 200,
      format: (value, row) => <UserName user={row} />,
    },
    { key: "username", name: "ACCESS Username", width: 100 },
    {
      key: "role",
      name: "Role",
      width: 100,
      format: (value, row) => (
        <select
          className="form-select"
          value={value}
          onChange={(e) => setUserRole(row.username, e.target.value)}
          disabled={!canManageUsers || value == "pi" || value == "co_pi"}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            right: 0,
            borderWidth: 0,
          }}
        >
          {roleOptions.filter(
            (option) =>
              option.key == value || !["pi", "co_pi"].includes(option.key),
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
      format: (value, row) => (
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

  for (let resource of resources)
    columns.push({
      key: resource.resourceId,
      name: resource.name,
      class: "text-center",
      disabled: !canManageUsers || !resource.isActive,
      icon: resource.icon,
      format: (value, row) => (
        <>
          <input
            className="form-check-input"
            disabled={!canManageUsers || !resource.isActive}
            onChange={(e) =>
              toggleUsersResources(
                e.target.checked,
                row.username,
                resource.resourceId,
              )
            }
            type="checkbox"
            checked={row.resourceIds.includes(resource.resourceId)}
          />
        </>
      ),
      formatHeader,
    });

  const rowClasses = users.map((user) =>
    user.hasChanges ? gridStyle.edited : "",
  );

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
        <div style={{ marginTop: "-1px", position: "relative", zIndex: 100 }}>
          <AsyncSelect
            classNames={{ control: () => "react-select" }}
            loadOptions={async (value) => {
              const users = await searchUsers(value);
              return users.map((user) => ({
                isDisabled: user.eligibility === "no",
                label: (
                  <span className="d-flex justify-content-between">
                    <span
                      className={
                        user.eligibility === "no"
                          ? "text-decoration-line-through"
                          : ""
                      }
                      style={{
                        color:
                          user.eligibility === "no" ? "#707070" : undefined,
                      }}
                    >
                      {user.username} ({user.firstName} {user.lastName},{" "}
                      {user.organization}
                      {user.email ? `, ${user.email}` : ""}
                    </span>
                    {user.eligibility === "no" && user.eligibilityReason && (
                      <span className="text-danger ms-2">
                        <i className="bi bi-exclamation-octagon"></i>{" "}
                        {user.eligibilityReason}
                      </span>
                    )}
                  </span>
                ),
                value: user,
              }));
            }}
            onChange={(option) => addUser(option.value)}
            placeholder="Add another user..."
            value={null}
            aria-label="Add another user"
          />
        </div>
      ) : null}
      {canManageUsers &&
      ((resources.length && !allInactive) || hasNonPIUsers) ? (
        <div className="d-flex mt-3">
          <button
            type="button"
            className="btn btn-danger me-2"
            disabled={saving || !hasChanges}
            onClick={resetUsers}
          >
            Reset Form
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving || !hasChanges}
            onClick={saveUsers}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      ) : null}
    </>
  );
}
