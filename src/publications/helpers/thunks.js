import {
  setPublication,
  changePubType,
  updateErrors,
  dataLoaded,
  updateShowSaved,
  resetState,
  updateSaving,
  hideError,
  addProject,
  setGrantNumber,
} from "./actions";
import config from "../../shared/helpers/config";
import { invalidFormAlert, validateForm } from "../FormValidation";

export const doiLookup = () => async (dispatch, getState) => {
  const doi = getState().publications_store.publication.doi;

  const formatted_DOI = encodeURIComponent(doi).replaceAll(".", "%2E");
  const lookup_error =
    "Unable to retrieve publication. Double check your DOI, or continue entering information manually.";

  fetch(`/publications/lookup?doi=${formatted_DOI}`)
    .then((res) => res.json())
    .then(
      (data) => {
        if (data.title != "") {
          let pub_type = getState().publications_store.publication_types.find(
            (pt) => pt.citation_style_type == data.type,
          );

          if (!pub_type) {
            dispatch(changePubType("Other"));
          } else {
            dispatch(changePubType(pub_type.publication_type));
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
  const grant_number = getState().publications_store.grant_number;
  const path = config.routes.publications_find_project_path();
  await fetch(`${path}?grant_number=${grant_number}`)
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

export const getData = () => async (dispatch) => {
  const path = /^\/requests/.test(window.location.pathname)
    ? config.routes.publication_path("new.json")
    : window.location.href + ".json";
  await fetch(path)
    .then((res) => res.json())
    .then((data) => {
      dispatch(dataLoaded(data));
    });
};

export const savePublication = () => async (dispatch, getState) => {
  const store = getState().publications_store;
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
