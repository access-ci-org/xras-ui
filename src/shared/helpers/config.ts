export type Routes = {
  edit_request_action_path: (requestId: number | string, actionId: number | string) => string;
  edit_request_path: (requestId: number | string) => string;
  how_to_path: () => string;
  get_your_first_project_path: () => string;
  profile_path: () => string;
  project_types_path: () => string;
  projects_path: () => string;
  projects_save_users_path: () => string;
  renew_request_path: (requestId: number | string) => string;
  request_action_path: (requestId: number | string, actionId: number | string) => string;
  request_actions_path: (requestId: number | string) => string;
  request_path: (requestId: number | string) => string;
  resources_path: () => string;
  search_people_path: () => string;
  usage_detail_path: (grantNumber: string, resourceId: number | string) => string;
  publications_dismiss_notice_path: () => string;
};

const baseUrl = "https://allocations.access-ci.org";

const config = {
  creditAlertThreshold: 1000,
  resourceTypeIcons: {
    credit: "cash-coin",
    compute: "cpu-fill",
    storage: "hdd-fill",
    program: "person-square",
  } as Record<string, string>,
  routes: {
    edit_request_action_path: (requestId, actionId) =>
      `/requests/${requestId}/actions/${actionId}/edit`,
    edit_request_path: (requestId) => `/requests/${requestId}/edit`,
    how_to_path: () => "/how-to",
    get_your_first_project_path: () => `${baseUrl}/get-your-first-project`,
    profile_path: () => `${baseUrl}/profile`,
    project_types_path: () => `${baseUrl}/project-types`,
    projects_path: () => `${baseUrl}/projects`,
    projects_save_users_path: () => "/projects/save_users",
    renew_request_path: (requestId) => `${baseUrl}/requests/${requestId}/renew`,
    request_action_path: (requestId, actionId) =>
      `${baseUrl}/requests/${requestId}/actions/${actionId}`,
    request_actions_path: (requestId) => `${baseUrl}/requests/${requestId}/actions`,
    request_path: (requestId) => `${baseUrl}/requests/${requestId}`,
    resources_path: () => `${baseUrl}/resources`,
    search_people_path: () => `${baseUrl}/search/people`,
    usage_detail_path: (grantNumber, resourceId) => `/usage/${grantNumber}/${resourceId}`,
    publications_dismiss_notice_path: () => "/publications/dismiss_notice",
  } as Routes,
  roleIcons: {
    PI: "person-fill-check",
    "Co-PI": "person-fill-add",
    "Allocation Manager": "person-fill-gear",
    User: "people-fill",
  } as Record<string, string>,
};

export default config;
