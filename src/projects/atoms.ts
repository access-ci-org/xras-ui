import { atom } from "jotai";
import { produce, type Draft } from "immer";
import { coalesce, getCost, roundNumber, sortResources, xrasRolesMap } from "../shared/helpers/utils";
import { routesAtom } from "../shared/routes";
import type {
  Action,
  AllowedAction,
  AllowedActionsMap,
  Project,
  ProjectListEntry,
  Request,
  Resource,
  SearchedUser,
  User,
} from "./types";

export const statuses = {
  error: "error",
  pending: "pending",
  success: "success",
} as const;

type ApiState = {
  error: string | null;
  projectsList: ProjectListEntry[];
  projectListLoading: boolean;
  projects: Record<string, Project>;
  requests: Record<string, Request>;
  username: string | null;
};

const initialApiState: ApiState = {
  error: null,
  projectsList: [],
  projectListLoading: false,
  projects: {},
  requests: {},
  username: null,
};

export const apiStateAtom = atom<ApiState>(initialApiState);

export const errorAtom = atom((get) => get(apiStateAtom).error);
export const projectsListAtom = atom((get) => get(apiStateAtom).projectsList);
export const projectListLoadingAtom = atom((get) => get(apiStateAtom).projectListLoading);
export const usernameAtom = atom((get) => get(apiStateAtom).username);

function update(get: (a: typeof apiStateAtom) => ApiState, set: any, recipe: (draft: Draft<ApiState>) => void) {
  set(apiStateAtom, produce(get(apiStateAtom), recipe));
}

// ---------------------------------------------------------------------------
// Pure data-shaping helpers (ported from apiSlice.js)
// ---------------------------------------------------------------------------

const getSortDate = (request: any) =>
  request.endDate || request.startDate || (request.actions[0] || {}).entryDate;

const getUserSortKey = (user: { role: string; lastName: string; firstName: string }) =>
  `${({ pi: "01", co_pi: "02", allocation_manager: "03" } as Record<string, string>)[user.role] || "04"} ${
    user.lastName
  }, ${user.firstName}`;

const sortRelativeOrder = (a: { relativeOrder: number }, b: { relativeOrder: number }) =>
  a.relativeOrder < b.relativeOrder ? -1 : 1;

const makeResource = ({
  allocationState,
  amountAllocated,
  amountApproved,
  amountRequested,
  amountUsed,
  attributeSets,
  baseExchangeRate,
  currentExchangeRate,
  currentExchangeRateEndDate,
  currentExchangeRateType,
  dependentResourceXrasIds,
  displayResourceName,
  endDate,
  exchangeRate,
  minimumExchange,
  organizationId,
  organizationFaviconUrl,
  organizationName,
  resourceRepositoryKey,
  resourceType,
  startDate,
  unitType,
  userGuideUrl,
  xrasResourceId,
}: any): Resource => {
  const isBoolean = unitType == "Yes / No";
  const isCredit = unitType == "ACCESS Credits";
  return {
    allocated: roundNumber(coalesce(amountAllocated, amountApproved) || 0, 0, "floor"),
    decimalPlaces: 0,
    endDate,
    exchangeRates: {
      base: {
        type: "base",
        unitCost: !isBoolean ? baseExchangeRate || exchangeRate : 0,
      },
      current: {
        endDate: currentExchangeRateEndDate,
        type: (currentExchangeRateType || "base").toLowerCase(),
        unitCost: !isBoolean ? currentExchangeRate || exchangeRate : 0,
      },
    },
    icon: isCredit ? "credit" : resourceType.toLowerCase(),
    isActive: allocationState == "active",
    isBoolean,
    isCredit,
    isFake: false,
    isUnderReview: false,
    isNew: false,
    minimumExchange: minimumExchange,
    name: displayResourceName.trim(),
    questions: (attributeSets || [])
      .filter(({ isActive }: any) => isActive)
      .sort(sortRelativeOrder)
      .map((attrSet: any) => ({
        attributeSetId: attrSet.attributeSetId,
        attributes: attrSet.attributes.sort(sortRelativeOrder).map((attr: any) => ({
          required: attr.isRequired,
          resourceAttributeId: attr.resourceAttributeId,
          label: attr.attributeName,
        })),
        fieldType: attrSet.attributeSetRelationType,
        label: attrSet.attributeSetName,
        resourceId: xrasResourceId,
        values: [],
      })),
    resourceProvider: {
      organizationId: organizationId,
      name: organizationName,
      favicon: organizationFaviconUrl,
    },
    requested: roundNumber(coalesce(amountRequested, amountAllocated) || 0, 0, "floor"),
    requires: dependentResourceXrasIds || [],
    resourceId: xrasResourceId,
    resourceRepositoryKey,
    startDate,
    type: resourceType,
    unit: unitType,
    used: roundNumber(amountUsed || 0, 0, "ceil"),
    userGuideUrl,
  };
};

const makeAllowedActionsMap = (allowedActions: any[]): AllowedActionsMap => {
  const result: AllowedActionsMap = {};
  for (const { actionType, allowedResources, opportunityId, opportunityName } of allowedActions) {
    const action: AllowedAction = {
      name: actionType,
      resources: allowedResources.map(makeResource).sort(sortResources),
      opportunityId,
      opportunityName,
    };
    if (actionType in result) {
      const existing = result[actionType];
      result[actionType] = Array.isArray(existing) ? [...existing, action] : [existing, action];
    } else {
      result[actionType] = action;
    }
  }

  // Alias transfer to exchange to make component logic simpler.
  // FIXME: Remove this when exchanges are enabled for Maximize requests in the
  // rules engine.
  if ("Transfer" in result && !("Exchange" in result)) result.Exchange = result.Transfer;
  return result;
};

const addRequest = (
  draft: Draft<ApiState>,
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
  }: any,
  { entryDate, grantNumber }: { entryDate: string; grantNumber: string },
) => {
  resources = resources || [];
  const request: Request = {
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
      }: any): Action => ({
        actionId,
        allowedOperations,
        detailAvailable,
        date: (entryDate || approvedStartDate || requestedStartDate).split("T")[0],
        deleteStatus: null,
        isRequest,
        resources: resources.map(makeResource).sort(sortResources),
        showDeleteModal: false,
        status: actionStatusType,
        type: actionType,
      }),
    ),
    allocationType,
    allowedActions: makeAllowedActionsMap(allowedActions),
    endDate,
    entryDate,
    exchangeActionId: null,
    exchangeActionEditable: true,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber,
    isMaximize: allocationType == "Maximize",
    requestId,
    resources: resources
      .map(makeResource)
      .filter((res: Resource) => res.isCredit || res.allocated > 0)
      .sort(sortResources),
    resourcesReason: "",
    returnedForCorrections: actions.find((action: any) => action.returnedForCorrections) ? true : false,
    returnedForCorrectionsNotes: actions.map((action: any) => action.adminComments).join(","),
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
  let exchangeResources: Record<number, Resource> = {};
  for (const action of request.actions) {
    if (
      ["Exchange", "Transfer"].includes(action.type) &&
      ["Submitted", "Under Review", "Incomplete"].includes(action.status)
    ) {
      request.exchangeActionId = action.actionId;
      request.exchangeActionEditable = action.status === "Incomplete";
      for (const res of action.resources) exchangeResources[res.resourceId] = res;
      for (const res of request.resources) {
        if (res.resourceId in exchangeResources) {
          res.requested += exchangeResources[res.resourceId].requested;
          delete exchangeResources[res.resourceId];
        }
      }
      request.resources.push(
        ...Object.values(exchangeResources).map((res) => ({ ...res, isNew: true })),
      );
      break;
    }
  }

  const exchangeAction = request.allowedActions.Exchange || request.allowedActions.Transfer;
  const exchangeActionSingle = Array.isArray(exchangeAction) ? exchangeAction[0] : exchangeAction;

  if (exchangeActionSingle) {
    // Create a mapping of available resources.
    exchangeResources = {};
    for (const resource of exchangeActionSingle.resources) exchangeResources[resource.resourceId] = resource;

    // Iterate over all current resources in the request.
    for (const resource of request.resources)
      if (resource.resourceId in exchangeResources) {
        // Add resource questions.
        resource.questions = exchangeResources[resource.resourceId].questions || [];
        // Add required resource IDs.
        resource.requires = exchangeResources[resource.resourceId].requires || [];
      }
  }

  // Ensure all requests have a credit-like resource.
  if (request.resources.length && !request.resources.find((res) => res.isCredit))
    request.resources.push(
      (exchangeActionSingle && exchangeActionSingle.resources.find((res: Resource) => res.isCredit)) || {
        allocated: 0,
        decimalPlaces: 0,
        exchangeRates: {
          base: { type: "base", unitCost: 1.0 },
          current: { type: "base", unitCost: 1.0 },
        },
        icon: "credit",
        isActive: true,
        isBoolean: false,
        isCredit: true,
        isFake: true,
        isUnderReview: false,
        isNew: false,
        minimumExchange: 0,
        name: "Credit Equivalents",
        requested: 0,
        requires: [],
        resourceId: 0,
        resourceProvider: { name: "" },
        unit: "Credit Equivalents",
        used: 0,
      },
    );

  draft.requests[requestId] = request as Draft<Request>;
};

const addProject = (
  draft: Draft<ApiState>,
  { grantNumber, projectManager, requestMasterId, requests, title, users }: any,
  projectStatus: string,
) => {
  grantNumber = grantNumber || requestMasterId;
  requests.sort((a: any, b: any) => (getSortDate(a) > getSortDate(b) ? -1 : 1));
  const currentRequest = requests.find((request: any) => request.timeStatus == "current");
  const currentRequestId = currentRequest ? currentRequest.requestId : null;
  draft.projects[grantNumber] = {
    currentRequestId,
    grantNumber,
    isManager: projectManager,
    requestsList: requests.map((request: any) => {
      const { actions, allocationType, endDate, requestId, startDate, status } = request;
      const entryDate = actions
        .map(({ entryDate }: any) => entryDate)
        .sort()[0]
        .split("T")[0];
      addRequest(draft, request, { entryDate, grantNumber });
      return { allocationType, endDate, entryDate, requestId, startDate, status };
    }),
    selectedRequestId: currentRequestId || requests[0].requestId,
    status: projectStatus,
    tab: "overview",
    title,
    users: users
      .map(
        ({
          eligibleReason,
          email,
          firstName,
          isEligible,
          lastName,
          organization,
          resources,
          role,
          username,
        }: any): User => {
          const userResources = resources.filter(
            (res: any) => res.userAccountState == "active" && res.unitType != "ACCESS Credits",
          );
          const resourceIds = userResources.map((res: any) => res.xrasResourceId);
          const resourceAccountPendingIds = userResources
            .filter((res: any) => res.resourceProviderState == "pending-active")
            .map((res: any) => res.xrasResourceId);
          const resourceAccountInactiveIds = resources
            .filter((res: any) => res.userAccountState != "active")
            .map((res: any) => res.xrasResourceId);
          const resourceUsernames: Record<number, string> = {};
          for (const res of userResources) resourceUsernames[res.xrasResourceId] = res.resourceUsername;
          return {
            eligibility: isEligible,
            eligibilityReason: eligibleReason,
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
        },
      )
      .sort((a: User, b: User) => (getUserSortKey(a) < getUserSortKey(b) ? -1 : 1)),
    usersNewRowIndex: 0,
    usersStatus: null,
  } as Draft<Project>;
  draft.projects[grantNumber].currentUser = draft.projects[grantNumber].users.find(
    ({ username }) => username == draft.username,
  );
};

const addResourceAndDeps = (resourceId: number, request: Draft<Request>) => {
  const exchangeAction = request.allowedActions.Exchange;
  const exchangeActionSingle = Array.isArray(exchangeAction) ? exchangeAction[0] : exchangeAction;
  if (!exchangeActionSingle) return;

  const exchangeResourcesMap: Record<number, Resource> = {};
  for (const res of exchangeActionSingle.resources) exchangeResourcesMap[res.resourceId] = res;

  const currentIds = request.resources.map((resource) => resource.resourceId);
  const requiredIds = exchangeResourcesMap[resourceId].requires || [];
  const addRequiredIds = !requiredIds.some((requiredId) => currentIds.includes(requiredId));

  const addIds = [resourceId, ...(addRequiredIds ? requiredIds : [])].filter(
    (id) => id in exchangeResourcesMap && !currentIds.includes(id),
  );

  request.resources.push(
    ...addIds.map((resourceId) => ({
      ...exchangeResourcesMap[resourceId],
      allocated: 0,
      isNew: true,
      used: 0,
      requested: 0,
    })),
  );
};

const arrayEquals = (a: unknown[], b: unknown[]) => {
  a = [...a].sort();
  b = [...b].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
};

export const filterResource = ({ allocated, isActive, isCredit }: Resource) =>
  allocated > 0 && isActive && !isCredit;

const updateUserHasChanges = (user: Draft<User>) =>
  (user.hasChanges =
    user.isNew || user.role != user.initialRole || !arrayEquals(user.resourceIds, user.initialResourceIds));

const getAuthToken = () =>
  document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? "";

// A write atom rather than a plain exported function so it can read the
// caller's per-store `routesAtom` (see src/shared/routes.ts) instead of the
// `config.routes` singleton: Users.tsx (its only caller) already renders
// inside the projects store's `Provider`, so `useSetAtom(searchUsersAtom)`
// there is a drop-in replacement for calling this directly.
export const searchUsersAtom = atom(null, async (get, _set, searchText: string): Promise<SearchedUser[]> => {
  const params = new URLSearchParams({ q: searchText });
  const res = await fetch(`${get(routesAtom).search_people_path()}?${params}`);
  return (await res.json()).map(
    ({
      eligible_reason,
      email,
      first_name,
      is_eligible,
      last_name,
      username,
      organization,
    }: any): SearchedUser => ({
      eligibility: is_eligible,
      eligibilityReason: eligible_reason,
      email,
      firstName: first_name,
      lastName: last_name,
      username,
      organization,
    }),
  );
});

// ---------------------------------------------------------------------------
// Async actions (ported from createAsyncThunk usages)
// ---------------------------------------------------------------------------

export const fetchProjectsListAtom = atom(null, async (get, set, username: string) => {
  set(apiStateAtom, produce(get(apiStateAtom), (draft) => {
    draft.projectListLoading = true;
  }));

  const res = await fetch(`${get(routesAtom).projects_path()}.json`);
  if (res.status != 200) {
    update(get, set, (draft) => {
      draft.error = "Failed to load project list.";
      draft.projectListLoading = false;
    });
    return;
  }

  const projectsList = (await res.json()).result;
  projectsList.sort((a: any, b: any) => (getSortDate(a.requests[0]) > getSortDate(b.requests[0]) ? -1 : 1));

  update(get, set, (draft) => {
    draft.username = username;
    draft.projectsList = projectsList.map((project: any) => {
      const { grantNumber, requestMasterId, requests, status, title } = project;
      const returnedForCorrections =
        project.requests.filter((r: any) => r.actions.filter((a: any) => a.returnedForCorrections).length > 0)
          .length > 0;
      const projectStatus = returnedForCorrections
        ? "Returned for Corrections"
        : status ||
          (requests &&
            (requests.find(({ timeStatus }: any) => timeStatus == "current")
              ? "Active"
              : requests[0].timeStatus == "past"
                ? "Inactive"
                : requests[0].status));
      if (requests) addProject(draft, project, projectStatus);
      return { grantNumber: grantNumber || requestMasterId, status: projectStatus, title };
    });
    draft.projectListLoading = false;
  });
});

export const fetchProjectDetailAtom = atom(null, (get, set, grantNumber: string) => {
  update(get, set, (draft) => {
    draft.projects[grantNumber] = { error: "Failed to load project data." } as Draft<Project>;
  });
});

export const fetchRequestDetailAtom = atom(null, (get, set, requestId: number) => {
  update(get, set, (draft) => {
    draft.requests[requestId] = { error: "Failed to load request data." } as Draft<Request>;
  });
});

export const fetchUsageDetailAtom = atom(
  null,
  async (
    get,
    set,
    {
      grantNumber,
      requestId,
      resourceRepositoryKey,
    }: { grantNumber: string; requestId: number; resourceRepositoryKey: string },
  ) => {
    update(get, set, (draft) => {
      draft.requests[requestId].usageDetailStatus = statuses.pending;
    });

    const res = await fetch(`${get(routesAtom).usage_detail_path(grantNumber, resourceRepositoryKey)}.json`);
    if (res.status == 200) {
      const usageDetail = (await res.json()).usage;
      update(get, set, (draft) => {
        draft.requests[requestId].usageDetail = usageDetail;
        draft.requests[requestId].usageDetailStatus = statuses.success;
      });
    } else {
      update(get, set, (draft) => {
        draft.requests[requestId].usageDetailStatus = statuses.error;
      });
    }
  },
);

export const deleteActionAtom = atom(
  null,
  async (get, set, { actionId, requestId }: { actionId: number; requestId: number }) => {
    const request = get(apiStateAtom).requests[requestId];
    const action = request.actions.find((requestAction) => requestAction.actionId == actionId);
    if (!action || !action.allowedOperations || !action.allowedOperations.includes("Delete")) return;

    update(get, set, (draft) => {
      const requestAction = draft.requests[requestId].actions.find((a) => a.actionId == actionId);
      if (requestAction) requestAction.deleteStatus = statuses.pending;
    });

    const url = get(routesAtom).request_action_path(request.requestId, action.actionId);
    const data: Record<string, string> = {
      _method: "delete",
      authenticity_token: getAuthToken(),
    };
    const res = await fetch(url, {
      body: Object.keys(data)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join("&"),
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      method: "POST",
    });

    // After a successful POST, the API returns a redirect to the action page.
    update(get, set, (draft) => {
      const draftRequest = draft.requests[requestId];
      const requestAction = draftRequest.actions.find((a) => a.actionId == actionId);
      if (!requestAction) return;

      if (res.status == 200) {
        if (requestAction.isRequest) {
          draftRequest.error = "This request has been deleted.";
          requestAction.allowedOperations = [];
        } else {
          draftRequest.actions = draftRequest.actions.filter((a) => a.actionId != requestAction.actionId);
        }
        requestAction.deleteStatus = statuses.success;
        requestAction.showDeleteModal = false;
      } else {
        requestAction.deleteStatus = statuses.error;
      }
    });
  },
);

export const saveResourcesAtom = atom(null, async (get, set, { requestId }: { requestId: number }) => {
  const request = get(apiStateAtom).requests[requestId];
  const requested_resources: Record<string, any> = {};
  const resource_attributes: Record<string, any> = {};

  for (const { allocated, isFake, questions, requested, resourceId } of request.resources)
    if (requested != allocated && !isFake) {
      requested_resources[resourceId] = {
        resource_id: resourceId,
        requested: 1,
        amount: requested - allocated,
      };
      for (const { attributes, values, fieldType } of questions || []) {
        if (values.length) {
          const attrId = attributes[0].resourceAttributeId;
          const isIdField = ["drop_down", "single_sel", "multi_sel"].includes(fieldType);
          const isMulti = fieldType == "multi_sel";
          const attrData: Record<string, any> = {
            resource_attribute_id: isMulti ? values : isIdField ? values[0] : attrId,
          };
          if (!isIdField) attrData.attribute_value = values[0];
          resource_attributes[attrId] = attrData;
        }
      }
    }

  const exchangeAction = request.allowedActions.Exchange;
  const exchangeActionSingle = Array.isArray(exchangeAction) ? exchangeAction[0] : exchangeAction;

  const data = {
    authenticity_token: getAuthToken(),
    request_action: {
      action_type: exchangeActionSingle?.name,
      user_comments: request.resourcesReason,
      resource_attributes,
    },
    requested_resources,
  };

  const routes = get(routesAtom);
  const url = request.exchangeActionId
    ? routes.request_action_path(request.requestId, request.exchangeActionId)
    : routes.request_actions_path(request.requestId);

  const res = await fetch(`${url}.json`, {
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    method: request.exchangeActionId ? "PUT" : "POST",
  });

  let errors: string[] = [];
  let actionId = null;
  try {
    const body = await res.json();
    errors = body.errors;
    actionId = body.actionId;
  } catch {
    errors = ["Unable to save exchange"];
    actionId = null;
  }

  update(get, set, (draft) => {
    const draftRequest = draft.requests[requestId];
    draftRequest.showResourcesModal = false;
    if (res.status == 200) {
      draftRequest.exchangeActionId = actionId;
      draftRequest.exchangeActionEditable = false;
      draftRequest.exchangeErrors = [];
      draftRequest.exchangeStatus = statuses.success;
    } else {
      draftRequest.exchangeActionId = actionId;
      draftRequest.exchangeActionEditable = true;
      draftRequest.exchangeErrors = errors;
      draftRequest.exchangeStatus = statuses.error;
    }
  });
});

export const saveUsersAtom = atom(null, async (get, set, { grantNumber }: { grantNumber: string }) => {
  const state = get(apiStateAtom);
  const users = state.projects[grantNumber].users;

  update(get, set, (draft) => {
    draft.projects[grantNumber].usersStatus = statuses.pending;
  });

  // The xras API either expects nothing or the entire list of users and their
  // resource ids, even the ones that haven't changed. So only send the list if there
  // is a change *somewhere*.
  const resourceChanges =
    users.filter((user) => !arrayEquals(user.resourceIds, user.initialResourceIds) || user.isNew).length == 0
      ? []
      : users.map((user) => ({ username: user.username, resources: user.resourceIds }));

  const roleChanges = users
    .filter((user) => user.role != user.initialRole)
    .map((user) => ({
      username: user.username,
      role: xrasRolesMap[user.role],
      initialRole: xrasRolesMap[user.initialRole],
    }));

  const data = {
    grantNumber,
    resourceChanges,
    roleChanges,
    authenticity_token: getAuthToken(),
  };

  const res = await fetch(get(routesAtom).projects_save_users_path(), {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });

  if (res.status == 200) {
    update(get, set, (draft) => {
      draft.projects[grantNumber].users = draft.projects[grantNumber].users.map((user) => ({
        ...user,
        initialResourceIds: [...user.resourceIds],
        initialRole: user.role,
        hasChanges: false,
        isNew: false,
      }));
      draft.projects[grantNumber].usersStatus = statuses.success;
    });
    return;
  }

  let errors: string[] = [];
  try {
    const body = await res.json();
    errors = body.errors;
  } catch {
    errors = ["Unable to save changes"];
  }
  update(get, set, (draft) => {
    draft.projects[grantNumber].usersErrors = errors;
    draft.projects[grantNumber].usersStatus = statuses.error;
  });
});

// ---------------------------------------------------------------------------
// Sync actions (ported from apiSlice.js reducers)
// ---------------------------------------------------------------------------

export const addResourceAtom = atom(
  null,
  (get, set, { requestId, resourceId }: { requestId: number; resourceId: number }) => {
    update(get, set, (draft) => {
      addResourceAndDeps(resourceId, draft.requests[requestId]);
    });
  },
);

export const addUserAtom = atom(
  null,
  (get, set, { grantNumber, user }: { grantNumber: string; user: SearchedUser }) => {
    update(get, set, (draft) => {
      const project = draft.projects[grantNumber];
      const request = draft.requests[project.currentRequestId!];
      if (project.users.map(({ username }) => username).includes(user.username)) return;

      project.users.push({
        ...user,
        resourceIds: request.resources.filter(filterResource).map((resource) => resource.resourceId),
        resourceUsernames: {},
        resourceAccountPendingIds: [],
        resourceAccountInactiveIds: [],
        role: "user",
        initialResourceIds: [],
        initialRole: "user",
        hasChanges: true,
        isNew: true,
      });
      project.usersNewRowIndex = project.users.length - 1;
    });
  },
);

export const closeUsageDetailModalAtom = atom(null, (get, set, { requestId }: { requestId: number }) => {
  update(get, set, (draft) => {
    const request = draft.requests[requestId];
    request.usageDetail = null;
    request.usageDetailStatus = null;
  });
});

export const resetResourcesAtom = atom(null, (get, set, { requestId }: { requestId: number }) => {
  update(get, set, (draft) => {
    const request = draft.requests[requestId];
    request.resourcesReason = "";
    request.resources = request.resources
      .filter((resource) => resource.isCredit || resource.allocated)
      .map((resource) => ({ ...resource, requested: resource.allocated }));
  });
});

export const resetUsersAtom = atom(null, (get, set, { grantNumber }: { grantNumber: string }) => {
  update(get, set, (draft) => {
    const project = draft.projects[grantNumber];
    project.users = project.users
      .filter(({ isNew }) => !isNew)
      .map((user) => ({
        ...user,
        resourceIds: [...user.initialResourceIds],
        role: user.initialRole,
        hasChanges: false,
      }));
  });
});

export const setRequestAtom = atom(
  null,
  (get, set, { grantNumber, requestId }: { grantNumber: string; requestId: number }) => {
    update(get, set, (draft) => {
      const project = draft.projects[grantNumber];
      if (project) {
        project.selectedRequestId = requestId;
        if (project.tab == "users" && project.currentRequestId != project.selectedRequestId)
          project.tab = "overview";
      }
    });
  },
);

export const setResourceQuestionValuesAtom = atom(
  null,
  (
    get,
    set,
    {
      requestId,
      resourceId,
      attributeSetId,
      values,
    }: { requestId: number; resourceId: number; attributeSetId: number; values: (number | string)[] },
  ) => {
    update(get, set, (draft) => {
      const request = draft.requests[requestId];
      for (const resource of request.resources) {
        if (resource.resourceId == resourceId) {
          for (const question of resource.questions || []) {
            if (question.attributeSetId == attributeSetId) {
              question.values = values;
              break;
            }
          }
          break;
        }
      }
    });
  },
);

export const setResourceRequestAtom = atom(
  null,
  (get, set, { requestId, resourceId, requested }: { requestId: number; resourceId: number; requested: number }) => {
    update(get, set, (draft) => {
      const request = draft.requests[requestId];
      let credit: Draft<Resource> | undefined;
      let availableCredits = 0;

      for (const resource of request.resources) {
        if (resource.resourceId == resourceId) {
          resource.requested = requested;
          // If the user is requesting a change to the resource,
          // make sure required resources are present in the request.
          if (resource.requested != resource.allocated) addResourceAndDeps(resource.resourceId, request);
        }
        if (resource.isCredit) {
          credit = resource;
          availableCredits += resource.allocated * resource.exchangeRates.base.unitCost;
        } else {
          availableCredits -= getCost(resource, "difference");
        }
      }

      if (credit) credit.requested = roundNumber(availableCredits, credit.decimalPlaces, "floor");
    });
  },
);

export const setResourcesReasonAtom = atom(
  null,
  (get, set, { requestId, reason }: { requestId: number; reason: string }) => {
    update(get, set, (draft) => {
      draft.requests[requestId].resourcesReason = reason;
    });
  },
);

export const setTabAtom = atom(null, (get, set, { grantNumber, tab }: { grantNumber: string; tab: string }) => {
  update(get, set, (draft) => {
    const project = draft.projects[grantNumber];
    if (project) project.tab = tab;
  });
});

export const setUserRoleAtom = atom(
  null,
  (get, set, { grantNumber, username, role }: { grantNumber: string; username: string; role: string }) => {
    update(get, set, (draft) => {
      const user = draft.projects[grantNumber].users.find((u) => u.username == username);
      if (!user) return;
      user.role = role;
      updateUserHasChanges(user);
    });
  },
);

export const toggleActionsModalAtom = atom(null, (get, set, { requestId }: { requestId: number }) => {
  update(get, set, (draft) => {
    draft.requests[requestId].showActionsModal = !draft.requests[requestId].showActionsModal;
  });
});

export const toggleConfirmModalAtom = atom(null, (get, set, { requestId }: { requestId: number }) => {
  update(get, set, (draft) => {
    draft.requests[requestId].showConfirmModal = !draft.requests[requestId].showConfirmModal;
  });
});

export const toggleDeleteModalAtom = atom(
  null,
  (get, set, { requestId, actionId }: { requestId: number; actionId: number }) => {
    update(get, set, (draft) => {
      const requestAction = draft.requests[requestId].actions.find((a) => a.actionId == actionId);
      if (requestAction) requestAction.showDeleteModal = !requestAction.showDeleteModal;
    });
  },
);

export const toggleResourcesModalAtom = atom(null, (get, set, { requestId }: { requestId: number }) => {
  update(get, set, (draft) => {
    draft.requests[requestId].showResourcesModal = !draft.requests[requestId].showResourcesModal;
  });
});

export const toggleUsersResourcesAtom = atom(
  null,
  (
    get,
    set,
    {
      grantNumber,
      username,
      resourceId,
      checked,
    }: { grantNumber: string; username?: string | null; resourceId?: number | null; checked: boolean },
  ) => {
    update(get, set, (draft) => {
      const project = draft.projects[grantNumber];
      const request = draft.requests[project.currentRequestId!];
      const users = username ? [project.users.find((user) => user.username == username)!] : project.users;

      for (const user of users) {
        if (resourceId) {
          const idx = user.resourceIds.indexOf(resourceId);
          if (checked && idx == -1) {
            user.resourceIds.push(resourceId);
          } else if (!checked && idx >= 0) {
            user.resourceIds.splice(idx, 1);
          }
        } else {
          user.resourceIds = checked
            ? request.resources.filter(filterResource).map(({ resourceId }) => resourceId)
            : [];
        }
        updateUserHasChanges(user);
      }
    });
  },
);
