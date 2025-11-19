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
    profile_path: () => `${baseUrl}/profile`,
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
    // Publication routes
    publications_path: () => "/publications",
    publication_path: (id) => `/publications/${id}`,
    edit_publication_path: (id) => `/publications/${id}/edit`,
    publications_lookup_path: ({ doi }) => `/publications/lookup?doi=${encodeURIComponent(doi)}`,
    publications_find_project_path: ({ grant_number }) => `/publications/find_project?grant_number=${encodeURIComponent(grant_number)}`,
    publications_organization_mappings_path: () => "/publications/organization_mappings",
    publications_find_resource_path: ({ resource_name }) => `/publications/find_resource?resource_name=${encodeURIComponent(resource_name)}`,
    search_publications_path: (params) => {
      const queryString = new URLSearchParams(params).toString();
      return `/search/publications${queryString ? `?${queryString}` : ''}`;
    },
  },
  roleIcons: {
    PI: "person-fill-check",
    "Co-PI": "person-fill-add",
    "Allocation Manager": "person-fill-gear",
    User: "people-fill",
  },
};

export default config;
