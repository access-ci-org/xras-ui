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

export function projectsBrowser({ target }) {
  const typeLists = {};
  for (let key in target.dataset)
    typeLists[key] = JSON.parse(target.dataset[key]);
  const projectsBrowserStore = configureStore({
    reducer: {
      projectBrowser: browserSlice,
    },
    preloadedState: {
      projectBrowser: {
        ...projectsBrowserInitialState,
        typeLists,
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
