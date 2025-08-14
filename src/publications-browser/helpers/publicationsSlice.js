import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";
import config from "../../shared/helpers/config";

export const initApp = createAsyncThunk(
  "publicationsBrowser/initApp",
  async (args, { dispatch }) => {
    await dispatch(getPublications());
    await dispatch(getFilters());
  },
);

export const getPublications = createAsyncThunk(
  "publicationsBrowser/getPublications",
  async (args, { getState }) => {
    const state = getState().publicationsBrowser;
    const params = { page: state.page.current + 1 };
    const { doi, authorName, journal, publicationType } =
      state.filterSelections;

    if (doi) params["doi"] = doi;
    if (authorName) params["author_name"] = authorName;
    if (journal && state.filterOptions.journals.includes(journal))
      params["journal"] = journal;
    if (publicationType) params["publication_type"] = publicationType;

    const response = await fetch(
      config.routes.search_publications_path(params),
    );
    return await response.json();
  },
);

export const getFilters = createAsyncThunk(
  "publicationsBrowser/getFilters",
  async () => {
    const response = await fetch(
      config.routes.search_publications_filters_path(),
    );
    const data = await response.json();
    return data.filters || [];
  },
);

export const publicationsSlice = createSlice({
  name: "publicationsBrowser",
  initialState,
  reducers: {
    updateFilterSelection: (state, { payload }) => {
      state.filterSelections[payload.name] = payload.value;
    },
    resetFilters: (state) => {
      state.filterSelections = {
        doi: "",
        allJournalsToggled: false,
        journal: "",
        authorName: "",
        publicationType: "",
      };
    },
    resetPublications: (state) => {
      state.publications = [];
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
        state.publications = [
          ...state.publications,
          ...(action.payload.publications || []),
        ];
        state.page.current = action.payload?.pagination?.current_page || 0;
        state.page.last = action.payload?.pagination?.last_page || 1;
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

export const { updateFilterSelection, resetFilters, resetPublications } =
  publicationsSlice.actions;

export const selectFilterSelections = (state) =>
  state.publicationsBrowser.filterSelections;
export const selectPublicationsLoaded = (state) =>
  state.publicationsBrowser.publicationsLoaded;
export const selectPublications = (state) =>
  state.publicationsBrowser.publications;
export const selectFilterOptions = (state) =>
  state.publicationsBrowser.filterOptions;
export const selectPage = (state) => state.publicationsBrowser.page;
export default publicationsSlice.reducer;
