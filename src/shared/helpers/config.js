const baseUrl = "https://allocations.access-ci.org";
const config = {
  creditAlertThreshold: 1000,
  resourceTypeIcons: {
    credit: "cash-coin",
    compute: "cpu-fill",
    storage: "hdd-fill",
    program: "person-square",
  },
  routes: {
    edit_request_action_path: (requestId, actionId) =>
      `/requests/${requestId}/actions/${actionId}/edit`,
    edit_request_path: (requestId) => `/requests/${requestId}/edit`,
    how_to_path: () => "/how-to",
    get_your_first_project_path: () => `${baseUrl}/get-your-first-project`,
    project_types_path: () => `${baseUrl}/project-types`,
    projects_path: () => `${baseUrl}/projects`,
    projects_save_users_path: () => "/projects/save_users",
    renew_request_path: (requestId) => `${baseUrl}/requests/${requestId}/renew`,
    request_action_path: (requestId, actionId) =>
      `${baseUrl}/requests/${requestId}/actions/${actionId}`,
    request_actions_path: (requestId) =>
      `${baseUrl}/requests/${requestId}/actions`,
    request_path: (requestId) => `${baseUrl}/requests/${requestId}`,
    resources_path: () => `${baseUrl}/resources`,
    search_people_path: () => `${baseUrl}/search/people`,
    usage_detail_path: (grantNumber, resourceId) =>
      `/usage/${grantNumber}/${resourceId}`,
  },
  roleIcons: {
    PI: "person-fill-check",
    "Co-PI": "person-fill-add",
    "Allocation Manager": "person-fill-gear",
    User: "people-fill",
  },
};

export default config;
