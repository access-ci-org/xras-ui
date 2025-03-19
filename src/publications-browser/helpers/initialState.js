export const initialState = {
  apiUrl: null,
  pages: 1,
  publications: [],
  publicationsLoaded: true,
  showPagination: false,
  filterSelections: {
    allJournalsToggled: false,
    doi: '',
    journal: '',
    firstName: '',
    lastName: ''
  },
  pageData: {
    current_page: 1,
    last_page: 1
  },
  filterOptions: {
    journals: []
  }
};
