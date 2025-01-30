import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";

export const initApp = createAsyncThunk(
  'publicationsBrowser/initApp',
  async(args,{getState, dispatch}) => {
    await dispatch(getPublications())
  }
)

export const getPublications = createAsyncThunk(
  'publicationsBrowser/getPublications',
  async(args, {getState}) => {
    const state = getState().publicationsBrowser;
    const url = `${state.apiUrl}`;
    console.log("Fetching data from API:", url);
    const response = await fetch(url);
    const data = await response.json();

    return data || [];
  }
)

export const publicationsSlice = createSlice({
  name: 'publicationsBrowser',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPublications.pending, (state) => {
        state.publicationsLoaded = false;
        state.error = null;
      })
      .addCase(getPublications.fulfilled, (state, action) => {
        state.publicationsLoaded = true;
        state.publications = action.payload;
      })
      .addCase(getPublications.rejected, (state, action) => {
        state.publicationsLoaded = true;
        state.error = action.error.message;
      });
  },
})

export const selectPublicationsLoaded = (state) => state.publicationsBrowser.publicationsLoaded;
export const selectPublications = (state) => state.publicationsBrowser.publications
export default publicationsSlice.reducer;
