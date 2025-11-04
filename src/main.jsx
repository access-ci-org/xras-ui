import ReactDOM from "react-dom/client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { addRoutes } from "./shared/helpers/utils";

import AllocationsMap from "./allocations-map/AllocationsMap";

import Resources from "./resources/Resources";
import EditResource from "./edit-resource/EditResource";

import Projects from "./projects/Projects";
import apiSlice from "./projects/helpers/apiSlice";

import ProjectsBrowser from "./projects-browser/ProjectsBrowser";
import browserSlice from "./projects-browser/helpers/browserSlice";
import { initialState as projectsBrowserInitialState } from "./projects-browser/helpers/initialState";

import MyPublications from "./publications/MyPublications";
import PublicationsBrowser from "./publications/PublicationsBrowser";
import PublicationEdit from "./publications/PublicationEdit";
import PublicationsSelect from "./publications/PublicationsSelect";
import publicationsSearchSlice, {
  initialState as publicationsSearchInitialState,
} from "./publications/helpers/publicationsSearchSlice";
import publicationEditSlice, {
  initialState as publicationEditInitialState,
} from "./publications/helpers/publicationEditSlice";
import publicationsSelectSlice, {
  initialState as publicationsSelectInitialState,
} from "./publications/helpers/publicationsSelectSlice";

import OnRampsResourceCatalog from "./onramps-resource-catalog/ResourceCatalog";
import onRampsCatalogSlice from "./onramps-resource-catalog/helpers/catalogSlice";

import ResourceCatalog from "./resource-catalog/ResourceCatalog";
import catalogSlice from "./resource-catalog/helpers/catalogSlice";

export function shadowTarget(
  host,
  { bootstrapFonts = true, bootstrapVariables = true, baseUrl = null } = {},
) {
  const shadow = host.attachShadow({ mode: "open" });
  const bsOuter = document.createElement("div");
  const bsMiddle = document.createElement("div");
  const bsInner = document.createElement("div");
  const target = document.createElement("div");
  const bsStyle = document.createElement("link");
  const uiStyle = document.createElement("link");
  const accessStyle = document.createElement("link");
  baseUrl = baseUrl == null ? import.meta.url.replace(/\/[^/]+$/, "") : baseUrl;

  bsStyle.rel = "stylesheet";
  bsStyle.href = `${baseUrl}/bootstrap.css`;
  uiStyle.rel = "stylesheet";
  uiStyle.href = `${baseUrl}/xras-ui.css`;
  accessStyle.rel = "stylesheet";
  accessStyle.href = `${baseUrl}/access.css`;

  bsInner.appendChild(target);
  bsMiddle.appendChild(bsInner);
  bsOuter.appendChild(bsMiddle);
  shadow.appendChild(bsStyle);
  shadow.appendChild(uiStyle);
  shadow.appendChild(accessStyle);
  shadow.appendChild(bsOuter);

  bsOuter.classList.add("bootstrap");
  if (bootstrapVariables) bsMiddle.classList.add("bootstrap-variables");
  if (bootstrapFonts) {
    bsInner.classList.add("bootstrap-fonts");
    bsInner.setAttribute("data-bs-theme", "light");
  }

  return target;
}

export function allocationsMap({ target }) {
  ReactDOM.createRoot(target).render(<AllocationsMap />);
}

export function resources({
  availableResources,
  unavailableResources,
  canAdd,
  relativeUrlRoot,
  target,
}) {
  ReactDOM.createRoot(target).render(
    <Resources
      availableResources={availableResources}
      unavailableResources={unavailableResources}
      canAdd={canAdd}
      relativeUrlRoot={relativeUrlRoot}
    />,
  );
}

export function editResource({
  resourceId,
  target,
  setExternalSubmit,
  relativeUrlRoot,
}) {
  ReactDOM.createRoot(target).render(
    <EditResource
      resourceId={resourceId}
      setExternalSubmit={setExternalSubmit}
      relativeUrlRoot={relativeUrlRoot}
    />,
  );
}

export function projects({ target, username, routes }) {
  addRoutes(routes);
  const projectsStore = configureStore({
    reducer: {
      api: apiSlice,
    },
  });
  ReactDOM.createRoot(target).render(
    <Provider store={projectsStore}>
      <Projects username={username} />
    </Provider>,
  );
}

export function projectsBrowser({ target, apiUrl }) {
  const projectsBrowserStore = configureStore({
    reducer: {
      projectsBrowser: browserSlice,
    },
    preloadedState: {
      projectsBrowser: {
        ...projectsBrowserInitialState,
        apiUrl,
      },
    },
  });
  ReactDOM.createRoot(target).render(
    <Provider store={projectsBrowserStore}>
      <ProjectsBrowser />
    </Provider>,
  );
}

export function publicationsBrowser({ target, routes, authenticityToken }) {
  addRoutes(routes);
  const publicationsSearchStore = configureStore({
    reducer: {
      publicationsSearch: publicationsSearchSlice,
      publicationEdit: publicationEditSlice,
    },
    preloadedState: {
      publicationEdit: {
        ...publicationEditInitialState,
        authenticityToken: authenticityToken,
      },
    },
  });

  ReactDOM.createRoot(target).render(
    <Provider store={publicationsSearchStore}>
      <PublicationsBrowser />
    </Provider>,
  );
}

export function publicationEdit({
  publicationId,
  target,
  routes,
  authenticityToken,
}) {
  const store = configureStore({
    reducer: {
      publicationEdit: publicationEditSlice,
    },
    preloadedState: {
      publicationEdit: {
        ...publicationEditInitialState,
        authenticityToken: authenticityToken,
      },
    },
  });
  addRoutes(routes);

  ReactDOM.createRoot(target).render(
    <Provider store={store}>
      <PublicationEdit publicationId={publicationId} />
    </Provider>,
  );
}

export function publicationsSelect({
  authenticityToken,
  routes,
  selectedPublicationIds,
  target,
  usernames,
}) {
  const store = configureStore({
    reducer: {
      publicationEdit: publicationEditSlice,
      publicationsSearch: publicationsSearchSlice,
      publicationsSelect: publicationsSelectSlice,
    },
    preloadedState: {
      publicationsSearch: {
        ...publicationsSearchInitialState,
        filterSelections: {
          ...publicationsSearchInitialState.filterSelections,
          createdBy: usernames,
        },
      },
      publicationEdit: {
        ...publicationEditInitialState,
        authenticityToken: authenticityToken,
      },
      publicationsSelect: {
        ...publicationsSelectInitialState,
        selected: selectedPublicationIds,
      },
    },
  });
  addRoutes(routes);

  ReactDOM.createRoot(target).render(
    <Provider store={store}>
      <PublicationsSelect />
    </Provider>,
  );
}

export function onRampsResourceCatalog({
  target,
  catalogSources,
  onRamps,
  baseUrl,
  onRampsApi,
}) {
  const store = configureStore({
    reducer: {
      resourceCatalog: onRampsCatalogSlice,
    },
  });
  ReactDOM.createRoot(target).render(
    <Provider store={store}>
      <OnRampsResourceCatalog
        catalogSources={catalogSources}
        onRamps={onRamps}
        baseUrl={baseUrl}
        onRampsApi={onRampsApi}
      />
    </Provider>,
  );
}

export function myPublications({
  authenticityToken,
  routes,
  target,
  username,
}) {
  addRoutes(routes);
  const myPublicationsStore = configureStore({
    reducer: {
      publicationEdit: publicationEditSlice,
      publicationsSearch: publicationsSearchSlice,
    },
    preloadedState: {
      publicationsSearch: {
        ...publicationsSearchInitialState,
        filterSelections: {
          ...publicationsSearchInitialState.filterSelections,
          createdBy: [username],
        },
      },
      publicationEdit: {
        ...publicationEditInitialState,
        authenticityToken: authenticityToken,
      },
    },
  });

  ReactDOM.createRoot(target).render(
    <Provider store={myPublicationsStore}>
      <MyPublications />
    </Provider>,
  );
}

export function resourceCatalog({
  target,
  apiUrl,
  excludedCategories,
  excludedFilters,
  excludedResources,
  allowedCategories,
  allowedFilters,
}) {
  const store = configureStore({
    reducer: {
      resourceCatalog: catalogSlice,
    },
  });
  ReactDOM.createRoot(target).render(
    <Provider store={store}>
      <ResourceCatalog
        apiUrl={apiUrl}
        excludedCategories={excludedCategories}
        excludedFilters={excludedFilters}
        excludedResources={excludedResources}
        allowedCategories={allowedCategories}
        allowedFilters={allowedFilters}
      />
    </Provider>,
  );
}

export function keywords({ allocationTypes, target }) {
  ReactDOM.createRoot(target).render(<Keywords allocationTypes={allocationTypes} />);
}
