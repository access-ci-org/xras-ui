import { createSelector, createSlice } from "@reduxjs/toolkit";
import config from "../../shared/helpers/config";
import { invalidFormAlert, validateForm } from "../FormValidation";

export const initialState = {
  authenticityToken: null,
  data_loaded: false,
  errors: [],
  form_valid: false,
  grant_number: "",
  projects: [],
  publication: {},
  publicationId: null,
  publication_types: [],
  saving: false,
  selected_resources: [],
  show_saved: false,
  showEditModal: false,
  resources_none_selected: false,
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
      state.projects = payload.publication.projects || [];
      
      state.selected_resources = (payload.publication.publication_resources || [])
        .map((pubResource) => pubResource.acct_resource_id)
        .filter(Boolean)
        .map((id) => Number(id)); // Ensure all IDs are numbers for consistent comparison
      
      state.resources_none_selected = payload.publication.access_staff_publication || false;
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
    setPublicationId: (state, { payload }) => {
      state.publicationId = payload;
    },
    setShowEditModal: (state, { payload }) => {
      state.showEditModal = payload;
    },
    resetState: (state) => {
      for (const [key, value] of Object.entries(initialState))
        state[key] = value;
    },
    toggleRequest: (state, { payload }) => {
      state.projects[payload].selected = !state.projects[payload].selected;
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
    updateSelectedResources: (state, { payload }) => {
      state.selected_resources = payload;
      if (payload.length > 0) {
        state.resources_none_selected = false;
      }
    },
    setResourcesNoneSelected: (state, { payload }) => {
      state.resources_none_selected = payload;
      if (payload) {
        state.selected_resources = [];
      }
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
  setPublicationId,
  setShowEditModal,
  resetState,
  toggleRequest,
  updateAuthor,
  updateErrors,
  updateField,
  updatePublication,
  updateSaving,
  updateSelectedResources,
  updateShowSaved,
  setResourcesNoneSelected,
} = publicationEditSlice.actions;

export const getPublication = (state) => state.publicationEdit.publication;
export const getDoi = (state) => state.publicationEdit.publication.doi;
export const getPubTypes = (state) => state.publicationEdit.publication_types;
export const getAuthors = (state) => state.publicationEdit.publication.authors;
export const getProjects = (state) => state.publicationEdit.projects;

export const getSelectedProjects = createSelector(
  [getProjects],
  (projects) => projects.filter((project) => project.selected),
);

export const getAvailableResources = createSelector(
  [getSelectedProjects],
  (selectedProjects) => {
    const seen = new Set();
    const resources = [];

    selectedProjects.forEach((project) => {
      (project.resources || []).forEach((resource) => {
        if (!resource?.resource_id || seen.has(resource.resource_id)) return;
        seen.add(resource.resource_id);
        resources.push(resource);
      });
    });

    return resources;
  },
);

export const getSelectedResources = (state) => state.publicationEdit.selected_resources;

export const getResourcesNoneSelected = (state) =>
  state.publicationEdit.resources_none_selected;

export const getResourcesSelectionSatisfied = createSelector(
  [getSelectedResources, getResourcesNoneSelected],
  (selectedResources, resourcesNoneSelected) =>
    selectedResources.length > 0 || resourcesNoneSelected,
);
export const getPublicationTags = (state) =>
  state.publicationEdit.publication.tags;
export const getErrors = (state) => state.publicationEdit.errors;
export const getDataLoaded = (state) => state.publicationEdit.data_loaded;
export const getPublicationId = (state) => state.publicationEdit.publicationId;
export const getShowEditModal = (state) => state.publicationEdit.showEditModal;
export const getShowSaved = (state) => state.publicationEdit.show_saved;
export const getSaving = (state) => state.publicationEdit.saving;
export const getFormValid = (state) => state.publicationEdit.form_valid;
export const getGrantNumber = (state) => state.publicationEdit.grant_number;

export const getSaveEnabled = (state) => {
  return (
    !getSaving(state) &&
    getDataLoaded(state) &&
    getFormValid(state) &&
    getAuthorsExist(state) &&
    state.publicationEdit.projects.filter((p) => p.selected).length > 0 &&
    getResourcesSelectionSatisfied(state)
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
      () => {
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

export const editPublication = (publicationId) => async (dispatch) => {
  dispatch(setPublicationId(publicationId));
  dispatch(setShowEditModal(true));
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

  const token =
    store.authenticityToken ||
    document.querySelector("meta[name=csrf-token]").content;

  const formData = {
    authenticity_token: token,
    publication: {
      ...publication,
      access_staff_publication: store.resources_none_selected,
    },
    authors: publication.authors.map((a) => ({ ...a, order: 0 })),
    tags: [],
    projects: projects,
    resources: store.selected_resources.map((resource_id) => ({
      resource_id: resource_id,
    })),
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
  dispatch(updateShowSaved(false));

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`Save failed with status ${response.status}`);
    }

    if (!publication.publication_id) {
      dispatch(resetState());
      dispatch(getData());
    }

    dispatch(updateShowSaved(true));
  } catch {
    dispatch(updateErrors("There was an error saving this publication."));
  } finally {
    dispatch(updateSaving(false));
  }
};

export default publicationEditSlice.reducer;
