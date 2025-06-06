import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";

export const initApp = createAsyncThunk(
  'publicationsBrowser/initApp',
  async(args,{getState, dispatch}) => {
    await dispatch(getPublications())
    await dispatch(getFilters())
  }
)

export const getPublications = createAsyncThunk(
  'publicationsBrowser/getPublications',
  async(args, {getState}) => {
    const state = getState().publicationsBrowser;
    let url = `${state.apiUrl}?page=${state.pageData.current_page}`;

    if (state.filterSelections.doi !== '') {
      url += `&doi=${encodeURIComponent(state.filterSelections.doi)}`;
    }

    if (state.filterSelections.authorName !== '') {
      url += `&author_name=${encodeURIComponent(state.filterSelections.authorName)}`;
    }

    if (state.filterSelections.journal !== '') {
      const journal = state.filterSelections.journal
      if(state.filterOptions.journals.includes(journal)) {
        url += `&journal=${encodeURIComponent(state.filterSelections.journal)}`;
      }
    }

    if (state.filterSelections.publicationType !== '') {
      url += `&publication_type=${encodeURIComponent(state.filterSelections.publicationType)}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    return data;
  }
)

export const getFilters = createAsyncThunk(
  'publicationsBrowser/getFilters',
  async (args, { getState, dispatch }) => {
    const state = getState().publicationsBrowser;
    const url = `${state.apiUrl}?filters=1`
    const response = await fetch(url);
    const data = await response.json();

    return data.filters || [];
  }
)

export const publicationsSlice = createSlice({
  name: 'publicationsBrowser',
  initialState,
  reducers: {
    updatePageData: (state, { payload }) => {
      if (payload.current_page) {
        state.pageData.current_page = payload.current_page;
      }
      if (payload.last_page) {
        state.pageData.last_page = payload.last_page;
      }
    },
    updateFilterSelection: (state, { payload }) => {
      state.filterSelections[payload.name] = payload.value;
    },
    resetFilters: (state) => {
      state.filterSelections = {
        doi: '',
        allJournalsToggled: false,
        journal: '',
        authorName: '',
        publicationType: ''
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPublications.pending, (state) => {
        state.publicationsLoaded = false;
        state.error = null;
      })
      .addCase(getPublications.fulfilled, (state, action) => {
        state.publicationsLoaded = true;
        state.publications = action.payload.publications || [];

        if (action.payload.pagination && action.payload.pagination.last_page !== state.pageData.last_page) {
          state.pageData.current_page = 1;
        }
        state.showPagination = true;
        if (action.payload.pagination) {
          state.pageData.last_page = action.payload.pagination.last_page;
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
})

export const {
  updatePageData,
  updateFilterSelection ,
  resetFilters,
} = publicationsSlice.actions;

export const selectFilterSelections = (state) => state.publicationsBrowser.filterSelections;
export const selectPublicationsLoaded = (state) => state.publicationsBrowser.publicationsLoaded;
export const selectPublications = (state) => state.publicationsBrowser.publications
export const selectFilterOptions = (state) => state.publicationsBrowser.filterOptions;
export const selectPageData = (state) => state.publicationsBrowser.pageData;
export default publicationsSlice.reducer;
