import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import config from "../../shared/helpers/config";

export const getPublications = createAsyncThunk(
  "publicationsSearch/getPublications",
  async (args, { getState }) => {
    const state = getState().publicationsSearch;
    const params = {};
    const { createdBy, doi, authorName, journal, publicationType } =
      state.filterSelections;

    if (doi) params.doi = doi;
    if (authorName) params.author_name = authorName;
    if (journal && state.filterOptions.journals.includes(journal))
      params.journal = journal;
    if (publicationType) params.publication_type = publicationType;
    if (createdBy.length) params.created_by = createdBy;

    if (state.usePagination) params.page = state.page.current + 1;
    else params.per_page = 9999;

    const response = await fetch(
      config.routes.search_publications_path(params),
      { headers: { Accept: "application/json" } },
    );
    return await response.json();
  },
);

export const getFilters = createAsyncThunk(
  "publicationsSearch/getFilters",
  async () => {
    const response = await fetch(
      config.routes.search_publications_filters_path(),
    );
    const data = await response.json();
    return data.filters || [];
  },
);

export const initialState = {
  publications: [],
  publicationsLoaded: false,
  filterSelections: {
    createdBy: [],
    doi: "",
    journal: "",
    authorName: "",
    publicationType: "",
  },
  filterOptions: {
    journals: [],
    publication_types: [],
  },
  page: {
    current: 0,
    last: 1,
  },
  usePagination: true,
};

export const publicationsSearchSlice = createSlice({
  name: "publicationsSearch",
  initialState,
  reducers: {
    addCreatedByUsername: (state, { payload }) => {
      state.filterSelections.createdBy.push(payload);
    },
    removeCreatedByUsername: (state, { payload }) => {
      state.filterSelections.createdBy =
        state.filterSelections.createdBy.filter(
          (username) => username !== payload,
        );
    },
    updateFilterSelection: (state, { payload }) => {
      state.filterSelections[payload.name] = payload.value;
    },
    resetFilters: (state) => {
      state.filterSelections = {
        createdBy: [],
        doi: "",
        journal: "",
        authorName: "",
        publicationType: "",
      };
    },
    resetPublications: (state) => {
      state.publications = [];
    },
    setUsePagination: (state, { payload }) => {
      state.usePagination = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPublications.pending, (state) => {
        state.publicationsLoaded = false;
        state.error = null;
      })
      .addCase(getPublications.fulfilled, (state, action) => {
        state.publicationsLoaded = true;
        if (state.usePagination) {
          state.publications = [
            ...state.publications,
            ...(action.payload.publications || []),
          ];
          state.page.current = action.payload?.pagination?.current_page || 0;
          state.page.last = action.payload?.pagination?.last_page || 1;
        } else {
          state.publications = action.payload.publications || [];
        }
      })
      .addCase(getPublications.rejected, (state, action) => {
        state.publicationsLoaded = true;
        state.error = action.error.message;
      })
      .addCase(getFilters.fulfilled, (state, action) => {
        state.filterOptions = action.payload;
      });
  },
});

export const {
  addCreatedByUsername,
  removeCreatedByUsername,
  resetFilters,
  resetPublications,
  setUsePagination,
  updateFilterSelection,
} = publicationsSearchSlice.actions;

export const selectFilterSelections = (state) =>
  state.publicationsSearch.filterSelections;
export const selectPublicationsLoaded = (state) =>
  state.publicationsSearch.publicationsLoaded;
export const selectPublications = (state) =>
  state.publicationsSearch.publications;
export const selectFilterOptions = (state) =>
  state.publicationsSearch.filterOptions;
export const selectPage = (state) => state.publicationsSearch.page;
export default publicationsSearchSlice.reducer;
