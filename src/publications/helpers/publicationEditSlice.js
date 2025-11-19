import { createSlice } from "@reduxjs/toolkit";
import config from "../../shared/helpers/config";
import { invalidFormAlert, validateForm } from "../FormValidation";

export const initialState = {
  authenticityToken: null,
  data_loaded: false,
  errors: [],
  form_valid: false,
  grant_number: "",
  projects: [],
  project_resources: {}, // Map of grant_number to resources array
  publication: { authors: [], fields: [] },
  publicationId: null,
  publication_types: [],
  saving: false,
  selected_tags: {},
  selected_tag_objects: {},
  show_saved: false,
  showEditModal: false,
  tag_categories: [],
  all_tag_categories: [], // Store all tags before filtering
  organization_mappings: {}, // Map of organization name -> abbreviation
  resource_to_provider_abbrev: {}, // Map of resource name -> provider abbreviation (object for Redux serialization)
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
      // Store resources for this project
      if (payload.resources && Array.isArray(payload.resources)) {
        state.project_resources[payload.grant_number] = payload.resources;
      }
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
      state.all_tag_categories = payload.tag_categories;
      state.tag_categories = payload.tag_categories;
      state.projects = payload.publication.projects;
      payload.publication.tags.forEach(
        (t) => {
          state.selected_tags[t.label] = t.options.map((o) => o.value);
          state.selected_tag_objects[t.label] = t.options;
        }
      );
      state.data_loaded = true;
    },
    setProjectResources: (state, { payload }) => {
      // Update resources for a specific project without duplicating
      const { grant_number, resources } = payload;
      if (resources && Array.isArray(resources)) {
        state.project_resources[grant_number] = resources;
      }
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
      Object.keys(initialState).forEach(key => {
        state[key] = initialState[key];
      });
    },
    toggleRequest: (state, { payload }) => {
      // Just toggle the project selection
      // Tag filtering will be handled by updateTagCategories
      state.projects[payload].selected = !state.projects[payload].selected;
    },
    updateTagCategories: (state) => {
      // Get all resources from selected projects
      const selectedProjects = state.projects.filter(p => p.selected);
      const allResources = new Set();
      const allProviders = new Set();
      // Build mapping from resource name to provider abbreviation
      const resourceToProviderAbbrev = new Map();
      
      selectedProjects.forEach(project => {
        const resources = state.project_resources[project.grant_number] || [];
        resources.forEach(resource => {
          if (resource.name) {
            allResources.add(resource.name);
            // Map resource name to provider abbreviation
            if (resource.resourceProvider) {
              allProviders.add(resource.resourceProvider);
              const abbrev = state.organization_mappings[resource.resourceProvider];
              if (abbrev) {
                resourceToProviderAbbrev.set(resource.name, abbrev);
              }
            }
          }
        });
      });
      
      // Store the mapping in state for use when Resource tags are selected
      // Convert Map to object for Redux serialization
      state.resource_to_provider_abbrev = Object.fromEntries(resourceToProviderAbbrev);
      
      // Filter tag categories based on selected projects' resources
      // Only show tags associated with selected projects
      // Also filter out Resource Provider category (it will be auto-selected)
      if (selectedProjects.length > 0) {
        state.tag_categories = state.all_tag_categories
          .filter(category => category.label !== "Resource Provider") // Hide Resource Provider category
          .map(category => {
          if (category.label === "Resource") {
            // Create options dynamically from resources, plus "None"
            // First, try to match existing tag options with resource names
            const resourceOptions = Array.from(allResources).map(resourceName => {
              // Try to find a matching tag option with better matching logic
              const resourceLower = resourceName.toLowerCase();
              const matchingOption = category.options.find(opt => {
                const optValueLower = (opt.value || "").toLowerCase();
                const optLabelLower = (opt.label || "").toLowerCase();
                
                // Exact match
                if (optValueLower === resourceLower || optLabelLower === resourceLower) return true;
                // If resource name contains the option value/label or vice versa
                if (resourceLower.includes(optValueLower) || optValueLower.includes(resourceLower)) return true;
                if (resourceLower.includes(optLabelLower) || optLabelLower.includes(resourceLower)) return true;
                
                // Check for abbreviations (e.g., "BIL" in "Brain Image Library")
                const extractAbbreviation = (str) => {
                  const words = str.split(/\s+/).filter(w => w.length > 0);
                  return words.map(w => w[0].toUpperCase()).join('');
                };
                const resourceAbbr = extractAbbreviation(resourceName);
                if (optValueLower === resourceAbbr.toLowerCase() || optLabelLower.includes(resourceAbbr.toLowerCase())) {
                  return true;
                }
                
                // Check if resource name contains key words from option (e.g., "Bridges-2" in "PSC Bridges-2 Regular Memory")
                if (optValueLower && resourceLower.includes(optValueLower)) return true;
                if (optLabelLower && resourceLower.includes(optLabelLower)) return true;
                
                return false;
              });
              
              // Use existing option if found (preserves ID/value), otherwise create new one
              // New ones won't be savable since they don't exist in the database
              if (matchingOption) {
                return { ...matchingOption, label: resourceName };
              }
              return { label: resourceName, value: resourceName };
            }).sort((a, b) => a.label.localeCompare(b.label));
            
            // Include saved tags that match existing database tag options
            // Use the mappings we already have from all_tag_categories
            const savedTagValues = new Set((state.selected_tags[category.label] || []).filter(t => t !== "None"));
            const savedTagOptionsMap = new Map();
            
            savedTagValues.forEach(savedValue => {
              // Find matching option from database tag options
              const matchingDbOption = category.options.find(opt => 
                opt.value === savedValue || opt.label === savedValue
              );
              
              if (matchingDbOption) {
                // Use the tag value as the key to deduplicate
                if (!savedTagOptionsMap.has(matchingDbOption.value)) {
                  savedTagOptionsMap.set(matchingDbOption.value, matchingDbOption);
                }
              }
            });
            
            // Merge saved tag options with resource options (deduplicate by value)
            const allOptionsMap = new Map();
            resourceOptions.forEach(opt => {
              allOptionsMap.set(opt.value, opt);
            });
            Array.from(savedTagOptionsMap.values()).forEach(opt => {
              if (!allOptionsMap.has(opt.value)) {
                allOptionsMap.set(opt.value, opt);
              }
            });
            
            // Add "None" option at the end
            const noneOption = category.options.find(opt => opt.value === "None") || 
                              { label: "None", value: "None" };
            const filteredOptions = [...Array.from(allOptionsMap.values()).sort((a, b) => a.label.localeCompare(b.label)), noneOption];
            
            // Build valid values: resource names + saved tag values that match DB options + "None"
            const validResourceValues = new Set([...allResources, "None"]);
            const validSavedValues = new Set(Array.from(savedTagOptionsMap.keys()));
            const validValues = new Set([...validResourceValues, ...validSavedValues]);
            
            // Preserve selected tags that are valid (either match resources or match DB tag options)
            const selectedInCategory = state.selected_tags[category.label] || [];
            state.selected_tags[category.label] = selectedInCategory.filter(tag => 
              validValues.has(tag)
            );
            // Also filter selected_tag_objects
            const selectedObjectsInCategory = state.selected_tag_objects[category.label] || [];
            state.selected_tag_objects[category.label] = selectedObjectsInCategory.filter(tagObj => 
              validValues.has(tagObj.value)
            );
            
            return {
              ...category,
              options: filteredOptions
            };
          }
          return category;
        });
      } else {
        // If no projects selected, show only "None" option
        // Filter out Resource Provider category
        state.tag_categories = state.all_tag_categories
          .filter(category => category.label !== "Resource Provider")
          .map(category => {
            if (category.label === "Resource") {
              // Clear invalid selected tags
              state.selected_tags[category.label] = [];
              state.selected_tag_objects[category.label] = [];
              return {
                ...category,
                options: [{ label: "None", value: "None" }]
              };
            }
            return category;
          });
        // Clear Resource Provider tags when no projects selected
        state.selected_tags["Resource Provider"] = [];
        state.selected_tag_objects["Resource Provider"] = [];
      }
      
      // Note: Resource Provider tags are now updated via lookupResourceProviders thunk
      // when Resource tags are selected, not in this reducer
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
      state.selected_tag_objects[payload.category] = payload.tags;
      
      // Note: Resource Provider tags will be auto-updated via lookupResourceProviders thunk
      // This is handled asynchronously when Resource tags change
    },
    updateShowSaved: (state, { payload }) => {
      state.show_saved = payload;
    },
    setOrganizationMappings: (state, { payload }) => {
      // Build a map of organization name -> abbreviation for quick lookup
      const mapping = {};
      payload.forEach(org => {
        if (org.name && org.abbrev) {
          mapping[org.name] = org.abbrev;
        }
      });
      state.organization_mappings = mapping;
    },
    setResourceProviderTags: (state, { payload }) => {
      // Set Resource Provider tags based on organization abbreviations
      const { providerTagOptions } = payload;
      if (providerTagOptions && providerTagOptions.length > 0) {
        state.selected_tags["Resource Provider"] = providerTagOptions.map(opt => opt.value);
        state.selected_tag_objects["Resource Provider"] = providerTagOptions;
      } else {
        state.selected_tags["Resource Provider"] = [];
        state.selected_tag_objects["Resource Provider"] = [];
      }
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
  toggleTag,
  updateTagCategories,
  setProjectResources,
  updateAuthor,
  updateErrors,
  updateField,
  updatePublication,
  updateSaving,
  updateSelectedTags,
  updateShowSaved,
  setOrganizationMappings,
  setResourceProviderTags,
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
export const getPublicationId = (state) => state.publicationEdit.publicationId;
export const getShowEditModal = (state) => state.publicationEdit.showEditModal;
export const getShowSaved = (state) => state.publicationEdit.show_saved;
export const getSaving = (state) => state.publicationEdit.saving;
export const getFormValid = (state) => state.publicationEdit.form_valid;
export const getGrantNumber = (state) => state.publicationEdit.grant_number;

export const getTagsValid = (state) => {
  const selectedTags = state.publicationEdit.selected_tags || {};
  const resourceTags = selectedTags["Resource"] || [];
  
  // Valid if Resource category has at least one tag selected (including "None")
  // Resource Provider tags are automatically selected in the background, but we don't
  // require them to be present for validation since they're auto-populated
  return resourceTags.length > 0;
};

export const getSaveEnabled = (state) => {
  return (
    !getSaving(state) &&
    getDataLoaded(state) &&
    getFormValid(state) &&
    getAuthorsExist(state) &&
    getTagsValid(state) &&
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
        // Update tag categories after adding project
        dispatch(updateTagCategories());
      },
      () => {
        dispatch(
          updateErrors("Unable to find a project with this grant number."),
        );
      },
    );
};

export const toggleProject = (index) => async (dispatch, getState) => {
  const state = getState().publicationEdit;
  const project = state.projects[index];
  
  // Toggle the project selection
  dispatch(toggleRequest(index));
  
  // Get fresh state after toggle
  const updatedState = getState().publicationEdit;
  const isNowSelected = updatedState.projects[index].selected;
  
  // If project is now selected and we don't have resources for it, fetch them
  if (isNowSelected && !updatedState.project_resources[project.grant_number]) {
    try {
      const res = await fetch(config.routes.publications_find_project_path({ grant_number: project.grant_number }));
      if (res.ok) {
        const projectData = await res.json();
        if (projectData.resources && Array.isArray(projectData.resources)) {
          dispatch(setProjectResources({ grant_number: project.grant_number, resources: projectData.resources }));
          // Update tag categories after fetching resources - get fresh state
          dispatch(updateTagCategories());
        } else {
          dispatch(updateTagCategories());
        }
      } else {
        dispatch(updateTagCategories());
      }
    } catch (error) {
      // Still update tag categories even if fetch fails
      dispatch(updateTagCategories());
    }
  } else {
    // Resources already exist or project was deselected, just update tag categories
    dispatch(updateTagCategories());
  }
};

export const editPublication = (publicationId) => async (dispatch) => {
  dispatch(setPublicationId(publicationId));
  dispatch(setShowEditModal(true));
};

export const getData = (publicationId) => async (dispatch) => {
  // Fetch organization mappings first
  try {
    const mappingsRes = await fetch(config.routes.publications_organization_mappings_path());
    if (mappingsRes.ok) {
      const mappingsData = await mappingsRes.json();
      dispatch(setOrganizationMappings(mappingsData.mappings || []));
    }
  } catch (error) {
    // Failed to fetch organization mappings, continue without them
  }

  const url = publicationId
    ? `${config.routes.edit_publication_path(publicationId)}.json`
    : config.routes.publication_path("new.json");
  await fetch(url, { headers: { accept: "application/json" } })
    .then((res) => res.json())
    .then(async (data) => {
      dispatch(dataLoaded(data));
      
      // Fetch resources for all selected projects
      const selectedProjects = data.publication.projects.filter(p => p.selected);
      for (const project of selectedProjects) {
        try {
          const grantNumber = project.grant_number;
          const res = await fetch(config.routes.publications_find_project_path({ grant_number: grantNumber }));
          if (res.ok) {
            const projectData = await res.json();
            if (projectData.resources) {
              // Store resources without duplicating the project
              dispatch(setProjectResources({ grant_number: grantNumber, resources: projectData.resources }));
            }
          }
        } catch (error) {
          // Failed to fetch resources for project
        }
      }
      
      // Update tag categories after loading resources
      dispatch(updateTagCategories());
    });
};

// Look up Resource Provider tags for selected resources
// Follows the logic: resource name -> acct.resources -> organization_id -> organizations.organizations -> organization_abbrev
export const lookupResourceProviders = (resourceNames) => async (dispatch, getState) => {
  const state = getState().publicationEdit;
  const resourceProviderCategory = state.all_tag_categories.find(cat => cat.label === "Resource Provider");
  
  if (!resourceProviderCategory || !resourceNames || resourceNames.length === 0) {
    dispatch(setResourceProviderTags({ providerTagOptions: [] }));
    return;
  }
  
  const providerAbbrevs = new Set();
  
  // Look up each resource to get its organization abbreviation
  for (const resourceName of resourceNames) {
    if (resourceName === "None") continue;
    
    try {
      // Call API endpoint to look up resource by name and get organization abbreviation
      // This endpoint should: 
      // 1. Find resource in acct.resources by name
      // 2. Get organization_id from that resource
      // 3. Find organization in organizations.organizations by organization_id
      // 4. Return organization_abbrev
      const res = await fetch(config.routes.publications_find_resource_path({ resource_name: resourceName }));
      if (res.ok) {
        const data = await res.json();
        if (data.organization_abbrev) {
          providerAbbrevs.add(data.organization_abbrev);
        }
      }
    } catch (error) {
      // Error looking up resource
    }
  }
  
  // Find matching tag options for the provider abbreviations
  const providerTagOptions = [];
  providerAbbrevs.forEach(abbrev => {
    const matchingOption = resourceProviderCategory.options.find(opt => 
      opt.value === abbrev || opt.label === abbrev
    );
    if (matchingOption) {
      providerTagOptions.push(matchingOption);
    }
  });
  
  // Update Resource Provider tags
  dispatch(setResourceProviderTags({ providerTagOptions }));
};

export const savePublication = () => async (dispatch, getState) => {
  const store = getState().publicationEdit;
  const projects = store.projects.filter((p) => p.selected);
  const selectedTags = store.selected_tags || {};
  
  // Map selected tag values back to actual tag values from all_tag_categories
  // The backend expects tag values that exist as pubtags in the database
  const tags = [];
  
  store.all_tag_categories.forEach(category => {
    const selectedValues = selectedTags[category.label] || [];
    selectedValues.forEach(tagValue => {
      if (tagValue !== "None") {
        // Find the matching tag option in all_tag_categories
        let tagOption = category.options.find(opt => 
          opt.value === tagValue || opt.label === tagValue
        );
        
        // If not found, try using organization mappings first
        if (!tagOption && category.label === "Resource Provider") {
          const abbrev = store.organization_mappings[tagValue];
          if (abbrev) {
            tagOption = category.options.find(opt => 
              opt.value === abbrev || opt.label === abbrev
            );
          }
        }
        
        // If still not found, try fuzzy matching
        if (!tagOption) {
          const tagValueLower = tagValue.toLowerCase();
          tagOption = category.options.find(opt => {
            const optValueLower = (opt.value || "").toLowerCase();
            const optLabelLower = (opt.label || "").toLowerCase();
            
            // Check if one contains the other
            if (tagValueLower.includes(optValueLower) ||
                optValueLower.includes(tagValueLower) ||
                tagValueLower.includes(optLabelLower) ||
                optLabelLower.includes(tagValueLower)) {
              return true;
            }
            
            // Extract abbreviation from tag value (e.g., "BIL" from "PSC Brain Image Library (BIL)")
            const extractAbbreviation = (str) => {
              const match = str.match(/\(([A-Z]+)\)/);
              if (match) return match[1].toLowerCase();
              const words = str.split(/\s+/).filter(w => w.length > 0);
              return words.map(w => w[0].toUpperCase()).join('').toLowerCase();
            };
            const tagAbbr = extractAbbreviation(tagValue);
            if (tagAbbr && (optValueLower === tagAbbr || optLabelLower.includes(tagAbbr))) {
              return true;
            }
            
            return false;
          });
        }
        
        // Use the matched tag's value (which exists in the database)
        // If no match found, skip it (can't save non-existent tags)
        if (tagOption && !tags.includes(tagOption.value)) {
          tags.push(tagOption.value);
        }
      }
    });
  });
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
    () => {
      if (!publication.publication_id) {
        dispatch(resetState());
        dispatch(getData());
      }
      dispatch(updateShowSaved(true));
      dispatch(updateSaving(false));
    },
    () => {
      dispatch(updateSaving(false));
      dispatch(updateErrors("There was an error saving this publication."));
    },
  );
};

export default publicationEditSlice.reducer;
