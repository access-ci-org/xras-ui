export const initialState = {
  apiUrl: null,
  listIsFiltered: false,
  pages: 1,
  projects: [],
  projectsLoaded: false,
  filtersLoaded: true,
  showPagination: false,
  singleEntry: false,
  filters: {
    org: '',
    allocationType: '',
    allFosToggled: true,
    resource: '',
    requestNumber: '',
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
