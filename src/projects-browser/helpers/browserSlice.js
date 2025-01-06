import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";

export const initApp = createAsyncThunk(
  'projectsBrowser/initApp',
  async(args, { getState, dispatch }) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if(urlParams.has('_requestNumber')){
      dispatch( updateFilter({ name: 'requestNumber', value: urlParams.get('_requestNumber')}) )
      dispatch( toggleListFiltered(true) );
    }
    await dispatch( getFilters() );
    await dispatch( getProjects() );
    dispatch( filterCleanup() );
  }
)

export const filterCleanup = createAsyncThunk(
  'projectsBrowser/filterCleanup',
  async (args, { getState, dispatch }) => {
    const state = getState().projectsBrowser;
    const filters = state.typeLists;
    // const orgs = state.projects
    //   .map((p) => p.piInstitution)
    //   .filter((g) => g)
    //   .filter((value, index, array) => array.indexOf(value) === index)
    //   .sort((a, b) => a > b)

    dispatch( setTypeLists({
      ...filters,
      orgs: ["-- ALL --"].concat(filters.orgs)
    }) );

  }
);

export const getFilters = createAsyncThunk(
  'projectsBrowser/getFilters',
  async (args, { getState, dispatch }) => {
    const state = getState().projectsBrowser;
    const url = `${state.apiUrl}?filters=1`;
    const response = await fetch(url);
    const data = await response.json();

    dispatch( setTypeLists(data.filters) );

  }
);

export const getProjects = createAsyncThunk(
  'projectsBrowser/getProjects',
  async (args, { getState, dispatch }) => {
    const state = getState().projectsBrowser;

    const filters = state.filters;

    const typeLists = state.typeLists;
    const fosList = typeLists.fosTypes.filter((fos) => fos.checked)
    let url = `${state.apiUrl}?page=${state.pageData.current_page}`;

    if(filters.requestNumber != ''){
      url += `&request_number=${filters.requestNumber}`;
      dispatch( toggleSingleEntry(true) );
    } else {
      dispatch( toggleSingleEntry(false) );
      if(fosList.length != typeLists.fosTypes.length){
        url += `&fos=${fosList.map((fos) => fos.fosTypeId).join(',')}`;
      }

      if(filters.org != '' && filters.org != '-- ALL --'){
        url += `&org=${encodeURIComponent(filters.org)}`;
      }

      if(filters.allocationType != ''){
        url += `&allocation_type=${filters.allocationType}`;
      }

      if(filters.resource != ''){
        url += `&resources=${filters.resource}`;
      }
    }

    const response = await fetch(url);
    const data = await response.json();

    return data;

  }
);

export const browserSlice = createSlice({
  name: 'projectsBrowser',
  initialState,
  reducers: {
    resetFilters: (state) => {
      state.filters = {
        org: '',
        allocationType: '',
        allFosToggled: false,
        resource: '',
        requestNumber: ''
      }

      browserSlice.caseReducers.toggleAllFos(state);

    },
    setApiUrl: (state, { payload }) => {
      state.apiUrl = payload;
    },
    setShowPagination: (state, { payload }) => {
      state.showPagination = payload;
    },
    setTypeLists: (state, { payload }) => {
      state.typeLists = payload;
    },
    toggleAllFos: (state) => {
      state.typeLists.fosTypes.forEach((fos) => fos.checked = !state.filters.allFosToggled );
      state.filters.allFosToggled = !state.filters.allFosToggled;
    },
    toggleFos: (state, { payload }) => {

      state.typeLists.fosTypes.forEach((fos) => {
        if(fos.fosTypeId == payload.fosTypeId){
          fos.checked = !fos.checked
        }
      })

      if(state.typeLists.fosTypes.filter((f) => f.checked).length != state.typeLists.fosTypes.length){
        state.filters.allFosToggled = false;
      } else {
        state.filters.allFosToggled = true;
      }
    },
    toggleListFiltered: (state, { payload }) => {
      state.listIsFiltered = payload;
    },
    toggleSingleEntry: (state, { payload }) => {
      state.singleEntry = payload;
    },
    updateFilter: (state, { payload }) => {
      state.filters[payload.name] = payload.value;
    },
    updatePageData: (state, { payload }) => {
      if(payload.current_page){
        state.pageData.current_page = payload.current_page;
      }

      if(payload.last_page){
        state.pageData.last_page = payload.last_page
      }
    }

  },
  extraReducers: (builder) => {
    builder
      .addCase(getProjects.pending, (state) => {
        state.projectsLoaded = false;
      })
      .addCase(getProjects.fulfilled, (state, action) => {
        const data = action.payload;
        state.projectsLoaded = true;
        state.projects = data.projects;
        if(data.pages != state.pageData.last_page){
          state.pageData.current_page = 1;
        }
        state.showPagination = true;
        state.pageData.last_page = data.pages;
      })
      .addCase(getProjects.rejected, (state, data) => {
        console.log(data.error)
      })
      .addCase(getFilters.pending, (state) => {
        state.filtersLoaded = false;
      })
      .addCase(getFilters.fulfilled, (state) => {
        state.filtersLoaded = true;
      })
  }
})

export const {
  resetFilters,
  setApiUrl,
  setShowPagination,
  setTypeLists,
  toggleAllFos,
  toggleFos,
  toggleListFiltered,
  toggleSingleEntry,
  updateFilter,
  updatePageData,
} = browserSlice.actions;

export const selectFilters = (state) => state.projectsBrowser.filters;
export const selectFiltersLoaded = (state) => state.projectsBrowser.filtersLoaded;
export const selectFosTypes = (state) => state.projectsBrowser.fosTypes;
export const selectIsFiltered = (state) => state.projectsBrowser.listIsFiltered;
export const selectIsSingleEntry = (state) => state.projectsBrowser.singleEntry;
export const selectProjectsLoaded = (state) => state.projectsBrowser.projectsLoaded;
export const selectPageData = (state) => state.projectsBrowser.pageData;
export const selectPages = (state) => state.projectsBrowser.selectPages;
export const selectProjects = (state) => state.projectsBrowser.projects;
export const selectShowPagination = (state) => state.projectsBrowser.filtersLoaded && state.projectsBrowser.projectsLoaded && state.projectsBrowser.pageData.last_page > 1;
export const selectTypeLists = (state) => state.projectsBrowser.typeLists;
export default browserSlice.reducer;
