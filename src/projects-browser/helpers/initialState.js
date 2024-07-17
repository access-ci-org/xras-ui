export const initialState = {
  apiUrl: null,
  pages: 1,
  projects: [],
  projectsLoaded: false,
  filtersLoaded: true,
  showPagination: false,
  filters: {
    org: '',
    allocationType: '',
    allFosToggled: true,
    resource: ''
  },
  pageData: {
    current_page: 1,
    last_page: 1
  },
  typeLists: {
    orgs: [],
    fosTypes: [],
    allocationTypes: [],
    resources: []
  }
};
