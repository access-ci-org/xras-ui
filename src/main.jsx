import ReactDOM from "react-dom/client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Provider as JotaiProvider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { addRoutes } from "./shared/helpers/utils";

import AllocationsMap from "./allocations-map/AllocationsMap";

import Resources from "./resources/Resources";
import EditResource from "./edit-resource/EditResource";

import Projects from "./projects/Projects";
import apiSlice from "./projects/helpers/apiSlice";

import ProjectsBrowser from "./projects-browser/ProjectsBrowser";

import MyPublications from "./publications/MyPublications";
import PublicationsBrowser from "./publications/PublicationsBrowser";
import PublicationEdit from "./publications/PublicationEdit";
import PublicationsSelect from "./publications/PublicationsSelect";
import { authenticityTokenAtom, publicationIdAtom } from "./publications/atoms";

import OnRampsResourceCatalog from "./onramps-resource-catalog/ResourceCatalog";

import ResourceCatalog from "./resource-catalog/ResourceCatalog";
import Keywords from "./keywords/Keywords";

export { supportingGrants } from "./supporting-grants";

export function shadowTarget(
  host,
  {
    bootstrapFonts = true,
    bootstrapVariables = true,
    baseUrl = null,
    stylesheets = null,
  } = {},
) {
  const shadow = host.attachShadow({ mode: "open" });
  const bsOuter = document.createElement("div");
  const bsMiddle = document.createElement("div");
  const bsInner = document.createElement("div");
  const target = document.createElement("div");
  baseUrl = baseUrl == null ? import.meta.url.replace(/\/[^/]+$/, "") : baseUrl;

  const hrefs = stylesheets ?? [
    `${baseUrl}/bootstrap.css`,
    `${baseUrl}/xras-ui.css`,
    `${baseUrl}/access.css`,
  ];
  for (const href of hrefs) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      href.startsWith("http") || href.startsWith("/")
        ? href
        : `${baseUrl}/${href}`;
    shadow.appendChild(link);
  }

  bsInner.appendChild(target);
  bsMiddle.appendChild(bsInner);
  bsOuter.appendChild(bsMiddle);
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
  ReactDOM.createRoot(target).render(<ProjectsBrowser api_url={apiUrl} />);
}

export function publicationsBrowser({ target, routes }) {
  addRoutes(routes);
  ReactDOM.createRoot(target).render(<PublicationsBrowser />);
}

function HydrateAtoms({ values, children }) {
  useHydrateAtoms(values);
  return children;
}

export function publicationEdit({
  publicationId,
  target,
  routes,
  authenticityToken,
}) {
  addRoutes(routes);
  const store = createStore();

  ReactDOM.createRoot(target).render(
    <JotaiProvider store={store}>
      <HydrateAtoms
        values={
          new Map([
            [publicationIdAtom, publicationId],
            [authenticityTokenAtom, authenticityToken],
          ])
        }
      >
        <PublicationEdit />
      </HydrateAtoms>
    </JotaiProvider>,
  );
}

export function publicationsSelect({
  authenticityToken,
  routes,
  selectedPublicationIds,
  target,
  usernames,
}) {
  addRoutes(routes);
  ReactDOM.createRoot(target).render(
    <PublicationsSelect
      authenticityToken={authenticityToken}
      selectedPublicationIds={selectedPublicationIds}
      usernames={usernames}
    />,
  );
}

export function onRampsResourceCatalog({
  target,
  catalogSources,
  onRamps,
  baseUrl,
  onRampsApi,
}) {
  ReactDOM.createRoot(target).render(
    <OnRampsResourceCatalog
      catalogSources={catalogSources}
      onRamps={onRamps}
      baseUrl={baseUrl}
      onRampsApi={onRampsApi}
    />,
  );
}

export function myPublications({
  authenticityToken,
  routes,
  target,
  username,
  showUpdatePublications,
}) {
  addRoutes(routes);
  ReactDOM.createRoot(target).render(
    <MyPublications
      authenticityToken={authenticityToken}
      username={username}
      showUpdatePublications={showUpdatePublications}
    />,
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
  ReactDOM.createRoot(target).render(
    <ResourceCatalog
      apiUrl={apiUrl}
      excludedCategories={excludedCategories}
      excludedFilters={excludedFilters}
      excludedResources={excludedResources}
      allowedCategories={allowedCategories}
      allowedFilters={allowedFilters}
    />,
  );
}

export function keywords({ allocationTypes, target }) {
  ReactDOM.createRoot(target).render(<Keywords allocationTypes={allocationTypes} />);
}
