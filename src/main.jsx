import ReactDOM from "react-dom/client";
import { Provider as JotaiProvider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { addRoutes } from "./shared/helpers/utils";
import { ShadowRootProvider } from "./lib/shadow-root";

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

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,70,400;0,100,400;0,100,600;0,100,800;1,100,400&display=swap";

// Chromium ignores `@font-face` rules declared inside a shadow tree, so the
// copy the stylesheets import there never takes effect. Register the web font
// on the document instead, where the shadow tree can still resolve it.
function addDocumentFont() {
  if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONT_HREF;
  document.head.appendChild(link);
}

export function shadowTarget(host, { baseUrl = null, stylesheets = null } = {}) {
  const shadow = host.attachShadow({ mode: "open" });
  addDocumentFont();
  const target = document.createElement("div");
  baseUrl = baseUrl == null ? import.meta.url.replace(/\/[^/]+$/, "") : baseUrl;

  // Running against `npm run dev` there is no `dist`, so `xras-ui.css` and
  // `access.css` don't exist yet: point at the sources the dev server can
  // serve instead. It answers a stylesheet request with `text/css`.
  const dev = Boolean(import.meta.env?.DEV);
  const hrefs =
    stylesheets ??
    (dev
      ? [`${baseUrl}/tailwind.css`, `${baseUrl}/bootstrap/access.scss`]
      : [`${baseUrl}/tailwind.css`, `${baseUrl}/xras-ui.css`, `${baseUrl}/access.css`]);
  for (const href of hrefs) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      href.startsWith("http") || href.startsWith("/")
        ? href
        : `${baseUrl}/${href}`;
    shadow.appendChild(link);
  }

  // The other half of the dev story: CSS modules (bundled into `xras-ui.css`
  // for a build) only exist in dev as `<style>` tags Vite injects into the
  // document head, which a shadow tree can't see. Copy them in.
  if (dev && !stylesheets)
    for (const style of document.querySelectorAll("style[data-vite-dev-id]"))
      shadow.appendChild(style.cloneNode(true));

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

export function projects({ target, username, routes, baseUrl = null, stylesheets = null }) {
  addRoutes(routes);

  // These components are styled with Tailwind, whose reset is in a cascade
  // layer and so loses to the host site's unlayered Bootstrap rules. Render in
  // a shadow root, where only the injected stylesheets apply. A caller that
  // wants control over the stylesheets can pass a `shadowTarget` as `target`.
  const root =
    target.getRootNode() instanceof ShadowRoot
      ? target
      : shadowTarget(target, { baseUrl, stylesheets });

  ReactDOM.createRoot(root).render(
    <ShadowRootProvider target={root}>
      <Projects username={username} />
    </ShadowRootProvider>,
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
