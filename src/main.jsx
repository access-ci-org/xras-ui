import ReactDOM from "react-dom/client";
import { Provider as JotaiProvider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { addRoutes } from "./shared/helpers/utils";

import AllocationsMap from "./allocations-map/AllocationsMap";

import Resources from "./resources/Resources";
import EditResource from "./edit-resource/EditResource";

import Projects from "./projects/Projects";

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

export function shadowTarget(host, { baseUrl = null, stylesheets = null } = {}) {
  const shadow = host.attachShadow({ mode: "open" });
  const target = document.createElement("div");
  baseUrl = baseUrl == null ? import.meta.url.replace(/\/[^/]+$/, "") : baseUrl;

  const hrefs = stylesheets ?? [`${baseUrl}/xras-ui.css`, `${baseUrl}/access.css`];
  for (const href of hrefs) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      href.startsWith("http") || href.startsWith("/")
        ? href
        : `${baseUrl}/${href}`;
    shadow.appendChild(link);
  }

  shadow.appendChild(target);

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
  ReactDOM.createRoot(target).render(<Projects username={username} />);
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
