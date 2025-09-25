import { createSlice } from "@reduxjs/toolkit";
import config from "../../shared/helpers/config";

const initialState = {
  authors: [],
  publications: [],
};

const publicationsSearchSlice = createSlice({
  name: "publicationsSearch",
  initialState,
  reducers: {
    setAuthors: (state, { payload }) => {
      state.authors = payload;
    },
    addAuthor: (state, { payload }) => {
      state.authors.push(payload);
    },
    removeAuthor: (state, { payload }) => {
      state.authors = state.authors.filter((a) => a !== payload);
    },
    setPublications: (state, { payload }) => {
      state.publications = payload;
    },
  },
});

export const { setAuthors, addAuthor, removeAuthor, setPublications } =
  publicationsSearchSlice.actions;

export const getAuthors = (state) => state.publicationsSearch.authors;
export const getPublications = (state) => state.publicationsSearch.publications;

export const updatePublications = () => async (dispatch, getState) => {
  const authors = getAuthors(getState());
  const res = await fetch(
    config.routes.search_publications_path({
      created_by: authors,
      per_page: 9999,
    }),
    { headers: { Accept: "application/json" } },
  );
  const data = await res.json();
  const sortedPublications = data.publications.sort((a, b) =>
    new Date(a.publication_year, a.publication_month - 1) >
    new Date(b.publication_year, b.publication_month - 1)
      ? -1
      : 1,
  );
  dispatch(setPublications(sortedPublications));
};

export default publicationsSearchSlice.reducer;
