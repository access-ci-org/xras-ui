import ReactDOM from "react-dom/client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

import AllocationsMap from "./allocations-map/AllocationsMap";

import Projects from "./projects/Projects";
import apiSlice from "./projects/helpers/apiSlice";
import projectsConfig from "./projects/helpers/config";

import ProjectsBrowser from "./projects-browser/ProjectsBrowser";
import browserSlice from "./projects-browser/helpers/browserSlice";
import { initialState as projectsBrowserInitialState } from "./projects-browser/helpers/initialState";

import Publications from "./publications/Publications";
import PublicationsSelect from "./publications/PublicationsSelect";
import publicationsConfig from "./publications/helpers/config";
import { publications_store } from "./publications/helpers/reducers";

import ResourceCatalog from "./resource-catalog/ResourceCatalog";
import catalogSlice from "./resource-catalog/helpers/catalogSlice";

export function shadowTarget(
  host,
  { bootstrapFonts = true, bootstrapVariables = true } = {}
) {
  const shadow = host.attachShadow({ mode: "open" });
  const bsOuter = document.createElement("div");
  const bsInner = document.createElement("div");
  const target = document.createElement("div");
  const bsStyle = document.createElement("link");
  const uiStyle = document.createElement("link");
  const baseUrl = import.meta.url.replace(/\/[^/]+$/, "");

  bsStyle.rel = "stylesheet";
  bsStyle.href = `${baseUrl}/bootstrap.css`;
  uiStyle.rel = "stylesheet";
  uiStyle.href = `${baseUrl}/xras-ui.css`;

  bsInner.appendChild(target);
  bsOuter.appendChild(bsInner);
  shadow.appendChild(bsOuter);
  shadow.appendChild(bsStyle);
  shadow.appendChild(uiStyle);

  bsOuter.classList.add("bootstrap");
  if (bootstrapVariables) bsInner.classList.add("bootstrap-variables");
  if (bootstrapFonts) bsInner.classList.add("bootstrap-fonts");

  return target;
}

export function allocationsMap({ target }) {
  ReactDOM.createRoot(target).render(<AllocationsMap />);
}

export function projects({ target, username, routes }) {
  // Override the default routes with the ones from Rails.
  if (routes) projectsConfig.routes = routes;
  const projectsStore = configureStore({
    reducer: {
      api: apiSlice,
    },
  });
  ReactDOM.createRoot(target).render(
    <Provider store={projectsStore}>
      <Projects username={username} />
    </Provider>
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
        apiUrl
      },
    },
  });
  ReactDOM.createRoot(target).render(
    <Provider store={projectsBrowserStore}>
      <ProjectsBrowser />
    </Provider>
  );
}

function publicationsStore() {
  return configureStore({
    reducer: {
      publications_store,
    },
  });
}

export function publications({ target, routes }) {
  if (routes) publicationsConfig.routes = routes;
  ReactDOM.createRoot(target).render(
    <Provider store={publicationsStore()}>
      <Publications />
    </Provider>
  );
}

export function publicationsSelect({ target, routes }) {
  if (routes) publicationsConfig.routes = routes;
  ReactDOM.createRoot(target).render(
    <Provider store={publicationsStore()}>
      <PublicationsSelect
        {...JSON.parse(target.dataset.publicationsSelectProps)}
      />
    </Provider>
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
    </Provider>
  );
}
