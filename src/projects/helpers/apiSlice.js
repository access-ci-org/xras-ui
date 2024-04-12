import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  coalesce,
  getCost,
  roundNumber,
  sortResources,
  xrasRolesMap,
} from "../../shared/helpers/utils";
import config from "../../shared/helpers/config";

export const statuses = {
  error: "error",
  pending: "pending",
  success: "success",
};

const getSortDate = (request) =>
  request.endDate || request.startDate || (request.actions[0] || {}).entryDate;

const getUserSortKey = (user) =>
  `${{ pi: "01", co_pi: "02", allocation_manager: "03" }[user.role] || "04"} ${
    user.lastName
  }, ${user.firstName}`;

const addProject = (
  state,
  { grantNumber, projectManager, requestMasterId, requests, title, users },
  projectStatus
) => {
  grantNumber = grantNumber || requestMasterId;
  requests.sort((a, b) => (getSortDate(a) > getSortDate(b) ? -1 : 1));
  const currentRequest = requests.find(
    (request) => request.timeStatus == "current"
  );
  const currentRequestId = currentRequest ? currentRequest.requestId : null;
  state.projects[grantNumber] = {
    currentRequestId,
    grantNumber,
    isManager: projectManager,
    requestsList: requests.map((request) => {
      const { actions, allocationType, endDate, requestId, startDate, status } =
        request;
      const entryDate = actions
        .map(({ entryDate }) => entryDate)
        .sort()[0]
        .split("T")[0];
      addRequest(state, request, { entryDate, grantNumber });
      return {
        allocationType,
        endDate,
        entryDate,
        requestId,
        startDate,
        status,
      };
    }),
    selectedRequestId: currentRequestId || requests[0].requestId,
    status: projectStatus,
    tab: "overview",
    title,
    users: users
      .map(
        ({
          email,
          firstName,
          lastName,
          organization,
          resources,
          role,
          username,
        }) => {
          const userResources = resources.filter(
            (res) =>
              res.userAccountState == "active" &&
              res.unitType != "ACCESS Credits"
          );
          const resourceIds = userResources.map((res) => res.xrasResourceId);
          const resourceAccountPendingIds = userResources
            .filter((res) => res.resourceProviderState == "pending-active")
            .map((res) => res.xrasResourceId);
          const resourceAccountInactiveIds = resources
            .filter((res) => res.userAccountState != "active")
            .map((res) => res.xrasResourceId);
          const resourceUsernames = {};
          for (let res of userResources)
            resourceUsernames[res.xrasResourceId] = res.resourceUsername;
          return {
            email,
            firstName,
            initialResourceIds: [...resourceIds],
            initialRole: role,
            lastName,
            organization,
            resourceAccountPendingIds,
            resourceAccountInactiveIds,
            resourceIds,
            resourceUsernames,
            role,
            username,
          };
        }
      )
      .sort((a, b) => (getUserSortKey(a) < getUserSortKey(b) ? -1 : 1)),
    usersNewRowIndex: 0,
    usersStatus: null,
  };
  state.projects[grantNumber].currentUser = state.projects[
    grantNumber
  ].users.find(({ username }) => username == state.username);
};

const addRequest = (
  state,
  {
    actions,
    allocationType,
    allowedActions,
    endDate,
    requestId,
    requestType,
    resources,
    startDate,
    status,
    timeStatus,
  },
  { entryDate, grantNumber }
) => {
  resources = resources || [];
  const request = {
    actions: actions.map(
      ({
        actionId,
        actionStatusType,
        actionType,
        allowedOperations,
        approvedStartDate,
        detailAvailable,
        entryDate,
        isRequest,
        requestedStartDate,
        resources,
      }) => ({
        actionId,
        allowedOperations,
        detailAvailable,
        date: (approvedStartDate || requestedStartDate || entryDate).split(
          "T"
        )[0],
        deleteStatus: null,
        isRequest,
        resources: resources.map(makeResource).sort(sortResources),
        showDeleteModal: false,
        status: actionStatusType,
        type: actionType,
      })
    ),
    allocationType,
    allowedActions: makeAllowedActionsMap(allowedActions),
    endDate,
    entryDate,
    exchangeActionId: null,
    exchangeStatus: null,
    grantNumber,
    isMaximize: allocationType == "Maximize",
    requestId,
    resources: resources
      .map(makeResource)
      .filter((res) => res.isCredit || res.allocated > 0)
      .sort(sortResources),
    resourcesReason: "",
    showActionsModal: false,
    showConfirmModal: false,
    showResourcesModal: false,
    startDate,
    status,
    timeStatus,
    type: requestType,
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: ["Explore", "Discover", "Accelerate"].includes(allocationType),
  };

  // Find a pending exchange action, if there is one.
  let exchangeResources = {};
  for (let action of request.actions) {
    if (
      ["Exchange", "Transfer"].includes(action.type) &&
      ["Submitted", "Under Review"].includes(action.status)
    ) {
      request.exchangeActionId = action.actionId;
      for (let res of action.resources) exchangeResources[res.resourceId] = res;
      for (let res of request.resources) {
        if (res.resourceId in exchangeResources) {
          res.requested += exchangeResources[res.resourceId].requested;
          delete exchangeResources[res.resourceId];
        }
      }
      request.resources.push(
        ...Object.values(exchangeResources).map((res) => ({
          ...res,
          isNew: true,
        }))
      );
      break;
    }
  }

  // Add resource questions to request resources.
  const exchangeAction =
    request.allowedActions.Exchange || request.allowedActions.Transfer;
  if (exchangeAction) {
    exchangeResources = {};
    for (let resource of exchangeAction.resources)
      exchangeResources[resource.resourceId] = resource;
    for (let resource of request.resources)
      if (resource.resourceId in exchangeResources)
        resource.questions =
          exchangeResources[resource.resourceId].questions || [];
  }

  // Add a fake credit-like resource to Maximize requests to enable exchanges.
  if (!request.usesCredits && resources.length)
    request.resources.push({
      allocated: 0,
      decimalPlaces: 0,
      exchangeRates: {
        base: {
          type: "base",
          unitCost: 1.0,
        },
        current: {
          type: "base",
          unitCost: 1.0,
        },
      },
      icon: "credit",
      isActive: true,
      isBoolean: false,
      isCredit: true,
      isFake: true,
      name: "Credit Equivalents",
      requested: 0,
      requires: [],
      resourceId: 0,
      unit: "Credit Equivalents",
      used: 0,
    });
  state.requests[requestId] = request;
};

const makeAllowedActionsMap = (allowedActions) => {
  const result = {};
  for (let {
    actionType,
    allowedResources,
    opportunityId,
    opportunityName,
  } of allowedActions) {
    let action = {
      name: actionType,
      resources: allowedResources.map(makeResource).sort(sortResources),
      opportunityId,
      opportunityName,
    };
    if (actionType in result) {
      if (!Array.isArray(result[actionType]))
        result[actionType] = [result[actionType]];
      result[actionType].push(action);
    } else {
      result[actionType] = action;
    }
  }

  // Alias transfer to exchange to make component logic simpler.
  // FIXME: Remove this when exchanges are enabled for Maximize requests in the
  // rules engine.
  if ("Transfer" in result && !("Exchange" in result))
    result.Exchange = result.Transfer;
  return result;
};

const sortRelativeOrder = (a, b) =>
  a.relativeOrder < b.relativeOrder ? -1 : 1;

const makeResource = ({
  allocationState,
  amountAllocated,
  amountApproved,
  amountRequested,
  amountUsed,
  attributeSets,
  dependentResourceXrasIds,
  displayResourceName,
  endDate,
  exchangeRate,
  organizationId,
  organizationFaviconUrl,
  organizationName,
  resourceRepositoryKey,
  resourceType,
  startDate,
  unitType,
  userGuideUrl,
  xrasResourceId,
}) => ({
  allocated: roundNumber(
    coalesce(amountAllocated, amountApproved) || 0,
    0,
    "floor"
  ),
  decimalPlaces: 0,
  endDate,
  // FIXME: Replace with actual exchange rate data from the API.
  exchangeRates: {
    base: {
      type: "base",
      unitCost:
        unitType != "[Yes = 1, No = 0]" && exchangeRate ? exchangeRate : 0,
    },
    current:
      unitType == "ACCESS Credits"
        ? {
            type: "base",
            unitCost:
              unitType != "[Yes = 1, No = 0]" && exchangeRate
                ? exchangeRate
                : 0,
          }
        : {
            type: "discount-time",
            endDate: "2024-05-01",
            unitCost:
              (unitType != "[Yes = 1, No = 0]" && exchangeRate
                ? exchangeRate
                : 0) * 0.9,
          },
  },
  icon: unitType == "ACCESS Credits" ? "credit" : resourceType.toLowerCase(),
  isActive: allocationState == "active",
  isBoolean: unitType == "[Yes = 1, No = 0]",
  isCredit: unitType == "ACCESS Credits",
  isFake: false,
  isUnderReview: false,
  isNew: false,
  name: displayResourceName.trim(),
  questions: (attributeSets || [])
    .filter(({ isActive }) => isActive)
    .sort(sortRelativeOrder)
    .map((attrSet) => ({
      attributeSetId: attrSet.attributeSetId,
      attributes: attrSet.attributes.sort(sortRelativeOrder).map((attr) => ({
        required: attr.isRequired,
        resourceAttributeId: attr.resourceAttributeId,
        label: attr.attributeName,
      })),
      fieldType: attrSet.attributeSetRelationType,
      label: attrSet.attributeSetName,
      resourceId: xrasResourceId,
      values: [],
    })),
  // FIXME: Replace with information about the resource provider from the API.
  resourceProvider: {
    organizationId: organizationId,
    name: organizationName,
    favicon: organizationFaviconUrl,
  },
  requested: roundNumber(
    coalesce(amountRequested, amountAllocated) || 0,
    0,
    "floor"
  ),
  requires: dependentResourceXrasIds || [],
  resourceId: xrasResourceId,
  resourceRepositoryKey,
  startDate,
  type: resourceType,
  unit: unitType,
  used: roundNumber(amountUsed || 0, 0, "ceil"),
  userGuideUrl,
});

const arrayEquals = (a, b) => {
  a = [...a].sort();
  b = [...b].sort();

  return a.length === b.length && a.every((value, index) => value === b[index]);
};

const getRequestAction = (state, action) => {
  const request = getRequest(state, action);
  for (let requestAction of request.actions)
    if (requestAction.actionId == action.payload.actionId) return requestAction;
};

const getProject = (state, action) =>
  state.projects[action.payload.grantNumber];

const getRequest = (state, action) => state.requests[action.payload.requestId];

const getUser = (state, action) =>
  getProject(state, action).users.find(
    ({ username }) => username == action.payload.username
  );

export const filterResource = ({ allocated, isActive, isCredit }) =>
  allocated > 0 && isActive && !isCredit;

const updateUserHasChanges = (user) =>
  (user.hasChanges =
    user.isNew ||
    user.role != user.initialRole ||
    !arrayEquals(user.resourceIds, user.initialResourceIds));

const getAuthToken = () =>
  document.querySelector("meta[name=csrf-token]").content;

export const searchUsers = async (searchText) => {
  const params = new URLSearchParams({ q: searchText });
  const res = await fetch(`${config.routes.search_people_path()}?${params}`);
  return (await res.json()).map(
    ({ email, first_name, last_name, username, organization }) => ({
      email,
      firstName: first_name,
      lastName: last_name,
      username,
      organization,
    })
  );
};

export const fetchProjectsList = createAsyncThunk(
  "api/fetchProjectsList",
  async (username, { rejectWithValue }) => {
    const res = await fetch(`${config.routes.projects_path()}.json`);
    if (res.status == 200)
      return { username, projectsList: (await res.json()).result };

    return rejectWithValue({});
  }
);

export const fetchProjectDetail = createAsyncThunk(
  "api/fetchProjectDetail",
  async ({ grantNumber }, { rejectWithValue }) => {
    return rejectWithValue({ grantNumber });
  }
);

export const fetchRequestDetail = createAsyncThunk(
  "api/fetchRequestDetail",
  async ({ grantNumber, requestId }, { rejectWithValue }) => {
    return rejectWithValue({ grantNumber, requestId });
  }
);

export const fetchUsageDetail = createAsyncThunk(
  "api/fetchUsageDetail",
  async (
    { grantNumber, requestId, resourceRepositoryKey },
    { rejectWithValue }
  ) => {
    const res = await fetch(
      `${config.routes.usage_detail_path(
        grantNumber,
        resourceRepositoryKey
      )}.json`
    );
    if (res.status == 200)
      return {
        grantNumber,
        requestId,
        resourceRepositoryKey,
        usageDetail: (await res.json()).usage,
      };

    return rejectWithValue({ grantNumber, requestId, resourceRepositoryKey });
  }
);

export const deleteAction = createAsyncThunk(
  "api/deleteAction",
  async ({ actionId, requestId }, { getState, rejectWithValue }) => {
    const request = getState().api.requests[requestId];
    const action = request.actions.find(
      (requestAction) => requestAction.actionId == actionId
    );
    if (
      !action ||
      !action.allowedOperations ||
      !action.allowedOperations.includes("Delete")
    )
      return rejectWithValue({ actionId, requestId });

    const url = config.routes.request_action_path(
      request.requestId,
      action.actionId
    );
    const data = {
      _method: "delete",
      authenticity_token: getAuthToken(),
    };
    const res = await fetch(url, {
      body: Object.keys(data)
        .map(
          (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
        )
        .join("&"),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      method: "POST",
    });

    // After a successful POST, the API returns a redirect to the action page.
    return res.status == 200
      ? { actionId, requestId }
      : rejectWithValue({ actionId, requestId });
  }
);

export const saveResources = createAsyncThunk(
  "api/saveResources",
  async ({ requestId }, { getState, rejectWithValue }) => {
    const request = getState().api.requests[requestId];
    const requested_resources = {};
    const resource_attributes = {};

    for (let {
      allocated,
      isFake,
      questions,
      requested,
      resourceId,
    } of request.resources)
      if (requested != allocated && !isFake) {
        requested_resources[resourceId] = {
          resource_id: resourceId,
          requested: 1,
          amount: requested - allocated,
        };
        for (let { attributes, values, fieldType } of questions) {
          if (values.length) {
            let attrId = attributes[0].resourceAttributeId;
            let isIdField = ["drop_down", "single_sel", "multi_sel"].includes(
              fieldType
            );
            let isMulti = fieldType == "multi_sel";
            let attrData = {
              resource_attribute_id: isMulti
                ? values
                : isIdField
                ? values[0]
                : attrId,
            };
            if (!isIdField) attrData.attribute_value = values[0];
            resource_attributes[attrId] = attrData;
          }
        }
      }

    const data = {
      authenticity_token: getAuthToken(),
      request_action: {
        action_type: request.allowedActions.Exchange.name,
        user_comments: request.resourcesReason,
        resource_attributes,
      },
      requested_resources,
    };

    const url = request.exchangeActionId
      ? config.routes.request_action_path(
          request.requestId,
          request.exchangeActionId
        )
      : config.routes.request_actions_path(request.requestId);

    const res = await fetch(`${url}.json`, {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
      method: request.exchangeActionId ? "PUT" : "POST",
    });

    // After a successful POST, the API returns a redirect to the action page.
    if (res.status == 200) {
      const exchangeActionId = parseInt(res.url.split("/").pop(), 10);
      return { requestId, exchangeActionId };
    }
    return rejectWithValue({ requestId });
  }
);

export const saveUsers = createAsyncThunk(
  "api/saveUsers",
  async ({ grantNumber }, { getState, rejectWithValue }) => {
    const state = getState().api;
    const users = state.projects[grantNumber].users;
    // The xras API either expects nothing or the entire list of users and their
    // resource ids, even the ones that haven't changed. So only send the list if there
    // is a change *somewhere*.
    const resourceChanges =
      users.filter(
        (user) =>
          !arrayEquals(user.resourceIds, user.initialResourceIds) || user.isNew
      ).length == 0
        ? []
        : users.map((user) => {
            return {
              username: user.username,
              resources: user.resourceIds,
            };
          });

    const roleChanges = users
      .filter((user) => {
        return user.role != user.initialRole;
      })
      .map((user) => {
        return {
          username: user.username,
          role: xrasRolesMap[user.role],
          initialRole: xrasRolesMap[user.initialRole],
        };
      });

    const data = {
      grantNumber,
      resourceChanges,
      roleChanges,
      authenticity_token: document.querySelector("meta[name=csrf-token]")
        .content,
    };

    const res = await fetch(config.routes.projects_save_users_path(), {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status == 200) {
      return { grantNumber };
    }

    return rejectWithValue({ grantNumber });
  }
);

export const apiSlice = createSlice({
  name: "api",
  initialState: {
    error: null,
    projectsList: [],
    projectListLoading: false,
    projects: {},
    requests: {},
    username: null,
  },
  reducers: {
    addResource: (state, action) => {
      const { resourceId } = action.payload;
      const request = getRequest(state, action);
      const exchangeAction = request.allowedActions.Exchange;
      if (!exchangeAction) return;

      const exchangeResourcesMap = {};
      for (let res of exchangeAction.resources)
        exchangeResourcesMap[res.resourceId] = res;

      const currentIds = request.resources.map(
        (resource) => resource.resourceId
      );

      const addIds = [
        resourceId,
        ...(exchangeResourcesMap[resourceId].requires || []),
      ].filter((id) => id in exchangeResourcesMap && !currentIds.includes(id));

      request.resources.push(
        ...addIds.map((resourceId) => ({
          ...exchangeResourcesMap[resourceId],
          allocated: 0,
          isNew: true,
          used: 0,
          requested: 0,
        }))
      );
    },
    addUser: (state, action) => {
      const project = getProject(state, action);
      const request = state.requests[project.currentRequestId];
      const { user } = action.payload;

      if (
        !project.users.map(({ username }) => username).includes(user.username)
      ) {
        project.users.push({
          ...user,
          resourceIds: request.resources
            .filter(filterResource)
            .map((resource) => resource.resourceId),
          role: "user",
          initialResourceIds: [],
          initialRole: "user",
          hasChanges: true,
          isNew: true,
        });
        project.usersNewRowIndex = project.users.length - 1;
      }
    },
    closeUsageDetailModal: (state, action) => {
      const request = getRequest(state, action);
      request.usageDetail = null;
      request.usageDetailStatus = null;
    },
    resetResources: (state, action) => {
      const request = getRequest(state, action);
      request.resourcesReason = "";
      request.resources = request.resources
        .filter((resource) => resource.isCredit || resource.allocated)
        .map((resource) => ({ ...resource, requested: resource.allocated }));
    },
    resetUsers: (state, action) => {
      const project = getProject(state, action);
      project.users = project.users
        .filter(({ isNew }) => !isNew)
        .map((user) => ({
          ...user,
          resourceIds: [...user.initialResourceIds],
          role: user.initialRole,
          hasChanges: false,
        }));
    },
    setRequest: (state, action) => {
      const project = getProject(state, action);
      if (project) {
        project.selectedRequestId = action.payload.requestId;
        if (
          project.tab == "users" &&
          project.currentRequestId != project.selectedRequestId
        )
          project.tab = "overview";
      }
    },
    setResourceQuestionValues: (state, action) => {
      const { attributeSetId, resourceId, values } = action.payload;
      const request = getRequest(state, action);
      for (let resource of request.resources) {
        if (resource.resourceId == resourceId) {
          for (let question of resource.questions) {
            if (question.attributeSetId == attributeSetId) {
              question.values = values;
              break;
            }
          }
          break;
        }
      }
    },
    setResourceRequest: (state, action) => {
      const { resourceId, requested } = action.payload;
      const request = getRequest(state, action);
      let credit;
      let availableCredits = 0;

      for (let resource of request.resources) {
        if (resource.resourceId == resourceId) {
          resource.requested = requested;
        }
        if (resource.isCredit) {
          credit = resource;
          availableCredits +=
            resource.allocated * resource.exchangeRates.base.unitCost;
        } else {
          availableCredits -= getCost(resource, "difference");
        }
      }

      if (credit)
        credit.requested = roundNumber(
          availableCredits,
          credit.decimalPlaces,
          "floor"
        );
    },
    setResourcesReason: (state, action) => {
      const request = getRequest(state, action);
      request.resourcesReason = action.payload.reason;
    },
    setTab: (state, action) => {
      const project = getProject(state, action);
      if (project) project.tab = action.payload.tab;
    },
    setUserRole: (state, action) => {
      const user = getUser(state, action);
      user.role = action.payload.role;
      updateUserHasChanges(user);
    },
    toggleActionsModal: (state, action) => {
      const request = getRequest(state, action);
      request.showActionsModal = !request.showActionsModal;
    },
    toggleConfirmModal: (state, action) => {
      const request = getRequest(state, action);
      request.showConfirmModal = !request.showConfirmModal;
    },
    toggleDeleteModal: (state, action) => {
      const requestAction = getRequestAction(state, action);
      requestAction.showDeleteModal = !requestAction.showDeleteModal;
    },
    toggleResourcesModal: (state, action) => {
      const request = getRequest(state, action);
      request.showResourcesModal = !request.showResourcesModal;
    },
    toggleUsersResources: (state, action) => {
      const project = getProject(state, action);
      const request = state.requests[project.currentRequestId];
      const { username, resourceId, checked } = action.payload;
      const users = username
        ? [project.users.find((user) => user.username == username)]
        : project.users;

      for (let user of users) {
        if (resourceId) {
          let idx = user.resourceIds.indexOf(resourceId);
          if (checked && idx == -1) {
            user.resourceIds.push(resourceId);
          } else if (!checked && idx >= 0) {
            user.resourceIds.splice(idx, 1);
          }
        } else {
          user.resourceIds = checked
            ? request.resources
                .filter(filterResource)
                .map(({ resourceId }) => resourceId)
            : [];
        }
        updateUserHasChanges(user);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsList.pending, (state) => {
        state.projectListLoading = true;
      })
      .addCase(fetchProjectsList.fulfilled, (state, action) => {
        action.payload.projectsList.sort((a, b) =>
          getSortDate(a.requests[0]) > getSortDate(b.requests[0]) ? -1 : 1
        );
        state.username = action.payload.username;
        state.projectsList = action.payload.projectsList.map((project) => {
          const { grantNumber, requestMasterId, requests, status, title } =
            project;
          const projectStatus =
            status ||
            (requests &&
              (requests.find(({ timeStatus }) => timeStatus == "current")
                ? "Active"
                : requests[0].timeStatus == "past"
                ? "Inactive"
                : requests[0].status));
          if (requests) addProject(state, project, projectStatus);
          return {
            grantNumber: grantNumber || requestMasterId,
            status: projectStatus,
            title,
          };
        });
        state.projectListLoading = false;
      })
      .addCase(fetchProjectsList.rejected, (state) => {
        state.error = "Failed to load project list.";
        state.projectListLoading = false;
      })
      .addCase(fetchProjectDetail.rejected, (state, action) => {
        const { grantNumber } = action.payload;
        state.projects[grantNumber] = { error: "Failed to load project data." };
      })
      .addCase(fetchRequestDetail.rejected, (state, action) => {
        const { requestId } = action.payload;
        state.requests[requestId] = {
          error: "Failed to load request data.",
        };
      })
      .addCase(fetchUsageDetail.pending, (state, action) => {
        const request = getRequest(state, { payload: action.meta.arg });
        request.usageDetailStatus = statuses.pending;
      })
      .addCase(fetchUsageDetail.fulfilled, (state, action) => {
        const request = getRequest(state, action);
        request.usageDetail = action.payload.usageDetail;
        request.usageDetailStatus = statuses.success;
      })
      .addCase(fetchUsageDetail.rejected, (state, action) => {
        const request = getRequest(state, action);
        request.usageDetailStatus = statuses.error;
      })
      .addCase(deleteAction.pending, (state, action) => {
        const requestAction = getRequestAction(state, {
          payload: action.meta.arg,
        });
        requestAction.deleteStatus = statuses.pending;
      })
      .addCase(deleteAction.fulfilled, (state, action) => {
        const request = getRequest(state, action);
        const requestAction = getRequestAction(state, action);

        if (requestAction.isRequest) {
          request.error = "This request has been deleted.";
          requestAction.allowedOperations = [];
        } else {
          request.actions = request.actions.filter(
            (a) => a.actionId != requestAction.actionId
          );
        }

        requestAction.deleteStatus = statuses.success;
        requestAction.showDeleteModal = false;
      })
      .addCase(deleteAction.rejected, (state, action) => {
        const requestAction = getRequestAction(state, action);
        requestAction.deleteStatus = statuses.error;
      })
      .addCase(saveResources.pending, (state, action) => {
        const request = getRequest(state, { payload: action.meta.arg });
        request.exchangeStatus = statuses.pending;
        request.showResourcesModal = false;
      })
      .addCase(saveResources.fulfilled, (state, action) => {
        const request = getRequest(state, action);
        request.exchangeActionId = action.payload.exchangeActionId;
        request.exchangeStatus = statuses.success;
      })
      .addCase(saveResources.rejected, (state, action) => {
        const request = getRequest(state, action);
        request.exchangeStatus = statuses.error;
      })
      .addCase(saveUsers.pending, (state, action) => {
        const project = getProject(state, { payload: action.meta.arg });
        project.usersStatus = statuses.pending;
      })
      .addCase(saveUsers.fulfilled, (state, action) => {
        const project = getProject(state, action);
        project.users = project.users.map((user) => ({
          ...user,
          initialResourceIds: [...user.resourceIds],
          initialRole: user.role,
          hasChanges: false,
          isNew: false,
        }));
        project.usersStatus = statuses.success;
      })
      .addCase(saveUsers.rejected, (state, action) => {
        const project = getProject(state, action);
        project.usersStatus = statuses.error;
      });
  },
});

export const selectError = (state) => state.api.error;
export const selectProjectsList = (state) => state.api.projectsList;
export const selectProjectListLoading = (state) => state.api.projectListLoading;
export const selectProjectDetail = (state, grantNumber) =>
  getProject(state.api, { payload: { grantNumber } });
export const selectRequestDetail = (state, requestId) =>
  getRequest(state.api, { payload: { requestId } });
export const selectUsername = (state) => state.api.username;

export const {
  addResource,
  addUser,
  closeUsageDetailModal,
  hideAlert,
  resetResources,
  resetUsers,
  setRequest,
  setResourceQuestionValues,
  setResourceRequest,
  setResourcesReason,
  setTab,
  setUserRole,
  toggleActionsModal,
  toggleConfirmModal,
  toggleDeleteModal,
  toggleResourcesModal,
  toggleUsersResources,
} = apiSlice.actions;

export default apiSlice.reducer;
