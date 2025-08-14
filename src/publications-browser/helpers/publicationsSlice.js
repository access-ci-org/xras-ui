import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";

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
    let url = `${state.apiUrl}?page=${state.page.current + 1}`;

    if (state.filterSelections.doi !== "") {
      url += `&doi=${encodeURIComponent(state.filterSelections.doi)}`;
    }

    if (state.filterSelections.authorName !== "") {
      url += `&author_name=${encodeURIComponent(state.filterSelections.authorName)}`;
    }

    if (state.filterSelections.journal !== "") {
      const journal = state.filterSelections.journal;
      if (state.filterOptions.journals.includes(journal)) {
        url += `&journal=${encodeURIComponent(state.filterSelections.journal)}`;
      }
    }

    if (state.filterSelections.publicationType !== "") {
      url += `&publication_type=${encodeURIComponent(state.filterSelections.publicationType)}`;
    }

    const response = await fetch(url);
    return await response.json();
  },
);

export const getFilters = createAsyncThunk(
  "publicationsBrowser/getFilters",
  async (args, { getState }) => {
    const state = getState().publicationsBrowser;
    const url = `${state.apiUrl}?filters=1`;
    const response = await fetch(url);
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
