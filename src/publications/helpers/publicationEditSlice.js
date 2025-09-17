import { createSlice } from "@reduxjs/toolkit";
import config from "../../shared/helpers/config";
import { invalidFormAlert, validateForm } from "../FormValidation";

const root = document.querySelector("#publications-react");
const dataset = root ? root.dataset : {};

const initialState = {
  publication_types: [],
  tag_categories: [],
  publication: {},
  projects: [],
  errors: [],
  selected_tags: {},
  data_loaded: false,
  saving: false,
  show_saved: false,
  redirect: dataset.redirect || false,
  modal: root == null,
  form_valid: false,
  grant_number: "",
};

const publicationEditSlice = createSlice({
  name: "publicationEdit",
  initialState,
  reducers: {
    addAuthor: (state) => {
      state.publication.authors.push({
        portal_username: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        prefix: "",
        suffix: "",
        initials: "",
        affiliation: "",
        hash: {},
      });
    },
    addProject: (state, { payload }) => {
      state.projects.push(payload);
    },
    changePublicationType: (state, { payload }) => {
      let newFields = state.publication_types.find(
        (pt) => pt.publication_type == payload,
      ).fields;

      // If there is data already in the fields, and the publication type they're switching to
      // has the same fields, preserve the data.
      newFields.forEach((nf) => {
        const field = state.publication.fields.find(
          (f) => f.csl_field_name == nf.csl_field_name,
        );
        if (field) {
          nf.value = field.value;
        }
      });

      state.publication.publication_type = payload;
      state.publication.fields = newFields;
    },
    dataLoaded: (state, { payload }) => {
      state.publication = payload.publication;
      state.form_valid = payload.publication.title.trim() == "" ? false : true;

      state.publication.authors.forEach((a) => {
        if (!a.affiliation) a.affiliation = "";
      });
      state.publication_types = payload.publication_types;
      state.tag_categories = payload.tag_categories;
      state.projects = payload.publication.projects;
      payload.publication.tags.forEach(
        (t) => (state.selected_tags[t.label] = t.options.map((o) => o.value)),
      );
      state.data_loaded = true;
    },
    deleteAuthor: (state, { payload }) => {
      state.publication.authors.splice(payload, 1);
    },
    hideError: (state, { payload }) => {
      state.errors = state.errors.filter((e) => e.id != payload);
    },
    setFormValid: (state, { payload }) => {
      state.form_valid = payload;
    },
    setGrantNumber: (state, { payload }) => {
      state.grant_number = payload;
    },
    setPublication: (state, { payload }) => {
      // Prefilling the per PublicationType fields
      state.publication.fields.forEach((f) => {
        f.field_value = payload[f.csl_field_name] || "";
      });

      // Prefilling the Publication fields
      Object.keys(state.publication).forEach((k) => {
        if (payload[k]) {
          state.publication[k] = payload[k];
        }
      });

      state.form_valid = payload["title"].trim() == "" ? false : true;
    },
    resetState: (state) => {
      for (const [key, value] of Object.entries(initialState))
        state[key] = value;
    },
    toggleRequest: (state, { payload }) => {
      state.projects[payload].selected = !state.projects[payload].selected;
    },
    toggleTag: (state, { payload }) => {
      let tagCategory = state.tag_categories.find(
        (tc) =>
          tc.publication_tags_category_id ==
          payload.publication_tags_category_id,
      );
      tagCategory.tags[payload.idx].selected =
        !tagCategory.tags[payload.idx].selected;
    },
    updateAuthor: (state, { payload }) => {
      state.publication.authors[payload.idx][payload.key] = payload.value;
    },
    updateErrors: (state, { payload }) => {
      state.errors.push({
        id: `${Math.random().toString(36).slice(2)}`,
        message: payload,
      });
    },
    updateField: (state, { payload }) => {
      state.publication.fields[payload.index].field_value = payload.value;
    },
    updatePublication: (state, { payload }) => {
      state.publication[payload.key] = payload.value;
    },
    updateSaving: (state, { payload }) => {
      state.saving = payload;
    },
    updateSelectedTags: (state, { payload }) => {
      state.selected_tags[payload.category] = payload.tags.map((t) => t.value);
    },
    updateShowSaved: (state, { payload }) => {
      state.show_saved = payload;
    },
  },
});

export const {
  addAuthor,
  addProject,
  changePublicationType,
  dataLoaded,
  deleteAuthor,
  hideError,
  setFormValid,
  setGrantNumber,
  setPublication,
  resetState,
  toggleRequest,
  toggleTag,
  updateAuthor,
  updateErrors,
  updateField,
  updatePublication,
  updateSaving,
  updateSelectedTags,
  updateShowSaved,
} = publicationEditSlice.actions;

export const getPublication = (state) => state.publicationEdit.publication;
export const getDoi = (state) => state.publicationEdit.publication.doi;
export const getPubTypes = (state) => state.publicationEdit.publication_types;
export const getAuthors = (state) => state.publicationEdit.publication.authors;
export const getTagCategories = (state) => state.publicationEdit.tag_categories;
export const getProjects = (state) => state.publicationEdit.projects;
export const getPublicationTags = (state) =>
  state.publicationEdit.publication.tags;
export const getErrors = (state) => state.publicationEdit.errors;
export const getDataLoaded = (state) => state.publicationEdit.data_loaded;
export const getShowSaved = (state) => state.publicationEdit.show_saved;
export const getSaving = (state) => state.publicationEdit.saving;
export const getModal = (state) => state.publicationEdit.modal;
export const getFormValid = (state) => state.publicationEdit.form_valid;
export const getGrantNumber = (state) => state.publicationEdit.grant_number;

export const getSaveEnabled = (state) => {
  return (
    !getSaving(state) &&
    getDataLoaded(state) &&
    getFormValid(state) &&
    getAuthorsExist(state) &&
    state.publicationEdit.projects.filter((p) => p.selected).length > 0
  );
};

export const getAuthorsExist = (state) => {
  const authors = getAuthors(state);

  if (authors.length == 0) {
    return false;
  }

  //Make sure that all of the authors have a non-empty first and last name
  return (
    authors.filter((a) => a.first_name == "" || a.last_name == "").length == 0
  );
};

export const doiLookup = () => async (dispatch, getState) => {
  const doi = getState().publicationEdit.publication.doi;
  const lookup_error =
    "Unable to retrieve publication. Double check your DOI, or continue entering information manually.";

  fetch(config.routes.publications_lookup_path({ doi }))
    .then((res) => res.json())
    .then(
      (data) => {
        if (data.title != "") {
          let pub_type = getState().publicationEdit.publication_types.find(
            (pt) => pt.citation_style_type == data.type,
          );

          if (!pub_type) {
            dispatch(changePublicationType("Other"));
          } else {
            dispatch(changePublicationType(pub_type.publication_type));
          }

          dispatch(setPublication(data));
        } else {
          dispatch(updateErrors(lookup_error));
        }
      },
      (err) => {
        dispatch(updateErrors(lookup_error));
      },
    );
};

export const grantSearch = () => async (dispatch, getState) => {
  const grant_number = getState().publicationEdit.grant_number;
  await fetch(config.routes.publications_find_project_path({ grant_number }))
    .then((res) => res.json())
    .then(
      (data) => {
        dispatch(addProject(data));
        dispatch(setGrantNumber(""));
      },
      () => {
        dispatch(
          updateErrors("Unable to find a project with this grant number."),
        );
      },
    );
};

export const getData = (publicationId) => async (dispatch) => {
  const url = publicationId
    ? `${config.routes.edit_publication_path(publicationId)}.json`
    : config.routes.publication_path("new.json");
  await fetch(url, { headers: { accept: "application/json" } })
    .then((res) => res.json())
    .then((data) => {
      dispatch(dataLoaded(data));
    });
};

export const savePublication = () => async (dispatch, getState) => {
  const store = getState().publicationEdit;
  const projects = store.projects.filter((p) => p.selected);
  const tags = Object.keys(store.selected_tags)
    .map((key) => store.selected_tags[key])
    .flat();
  const publication = { ...store.publication };
  const errors = store.errors;
  const { formValid, missingFields } = validateForm(
    publication,
    ["title", "publication_year", "publication_month"],
    ["first_name", "last_name"],
  );

  if (!formValid) {
    if (errors.length > 0) {
      Array.from(errors).forEach((error) => {
        dispatch(hideError(error.id));
      });
    }

    const errorAlert = invalidFormAlert(missingFields);
    dispatch(updateErrors(errorAlert));
    return;
  }

  const formData = {
    authenticity_token:
      document.getElementsByName("authenticity_token")[0].value,
    publication: publication,
    authors: publication.authors.map((a) => ({ ...a, order: 0 })),
    tags: tags,
    projects: projects,
  };

  let url, method;
  if (publication.publication_id) {
    url = config.routes.publication_path(publication.publication_id);
    method = "PATCH";
  } else {
    url = config.routes.publications_path();
    method = "POST";
  }

  dispatch(updateSaving(true));

  await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  }).then(
    (res) => {
      if (store.redirect) {
        window.location.href = config.routes.publications_path();
      } else {
        if (!publication.publication_id) {
          dispatch(resetState());
          dispatch(getData());
        }
        dispatch(updateShowSaved(true));
        dispatch(updateSaving(false));
      }
    },
    () => {
      dispatch(updateSaving(false));
      dispatch(updateErrors("There was an error saving this publication."));
    },
  );
};

export default publicationEditSlice.reducer;
