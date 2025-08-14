export const initialState = {
  apiUrl: null,
  publications: [],
  publicationsLoaded: false,
  filterSelections: {
    allJournalsToggled: false,
    doi: "",
    journal: "",
    authorName: "",
    publicationType: "",
  },
  page: {
    current: 0,
    last: 1,
  },
  filterOptions: {
    journals: [],
    publication_types: [],
  },
};
