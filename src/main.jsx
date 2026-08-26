import ReactDOM from "react-dom/client";
import { Provider as JotaiProvider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
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
import { routesAtom, mergeRoutes } from "./shared/routes";

import OnRampsResourceCatalog from "./onramps-resource-catalog/ResourceCatalog";

import ResourceCatalog from "./resource-catalog/ResourceCatalog";
import Keywords from "./keywords/Keywords";

import { SupportingGrantsSection } from "./supporting-grants";

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

export function shadowTarget(
  host,
  { baseUrl = null, stylesheets = null, extraStylesheets = [] } = {},
) {
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
  for (const href of [...hrefs, ...extraStylesheets]) {
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
  // document head, which a shadow tree can't see. Copy them in — whatever the
  // caller asked for as stylesheets, since none of them can carry the modules.
  if (dev)
    for (const style of document.querySelectorAll("style[data-vite-dev-id]"))
      shadow.appendChild(style.cloneNode(true));

  shadow.appendChild(target);

  return target;
}

/**
 * Renders `element` into a shadow root under `target`.
 *
 * These components are styled with Tailwind, whose reset is in a cascade layer
 * and so loses to the host site's unlayered Bootstrap rules. Rendering in a
 * shadow root means only the injected stylesheets apply. A caller that wants
 * control over the stylesheets can pass a `shadowTarget` as `target`.
 *
 * Returns an `unmount` function, which every mount function passes on to its
 * own caller. Calling it tears the React tree down, which is what lets a host
 * page that removes the surrounding markup — a modal or a turbo-style page
 * swap — stop the component's effects, timers and in-flight fetches instead of
 * leaving them running against detached DOM.
 *
 * It unmounts React and nothing else, deliberately: the shadow root and its
 * stylesheet links stay put, since `attachShadow` can't be undone and the
 * document-level web font link is shared by every mount on the page. So this
 * is a teardown handle, not a reset — mounting again wants a fresh host
 * element.
 */
function renderShadow(
  element,
  { target, baseUrl = null, stylesheets = null, extraStylesheets = [] },
) {
  const root =
    target.getRootNode() instanceof ShadowRoot
      ? target
      : shadowTarget(target, { baseUrl, stylesheets, extraStylesheets });

  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    <ShadowRootProvider target={root}>{element}</ShadowRootProvider>,
  );

  return () => reactRoot.unmount();
}

/*
 * The href of a stylesheet the host page loaded for a library that renders its
 * own DOM — maplibre's, for the map. The shadow tree can't see the document's
 * copy, so repeat the link inside it.
 */
function documentStylesheets(match) {
  return [...document.querySelectorAll(`link[rel="stylesheet"][href*="${match}"]`)].map(
    (link) => link.href,
  );
}

export function allocationsMap({ target, baseUrl = null, stylesheets = null }) {
return renderShadow(<AllocationsMap />, {
    target,
    baseUrl,
    stylesheets,
    extraStylesheets: documentStylesheets("maplibre-gl"),
  });
}

export function resources({
  availableResources,
  unavailableResources,
  canAdd,
  relativeUrlRoot,
  target,
  baseUrl = null,
  stylesheets = null,
}) {
return renderShadow(
    <Resources
      availableResources={availableResources}
      unavailableResources={unavailableResources}
      canAdd={canAdd}
      relativeUrlRoot={relativeUrlRoot}
    />,
    { target, baseUrl, stylesheets },
  );
}

export function editResource({
  resourceId,
  target,
  setExternalSubmit,
  relativeUrlRoot,
  baseUrl = null,
  stylesheets = null,
}) {
return renderShadow(
    <EditResource
      resourceId={resourceId}
      setExternalSubmit={setExternalSubmit}
      relativeUrlRoot={relativeUrlRoot}
    />,
    { target, baseUrl, stylesheets },
  );
}

export function projects({ target, username, routes, baseUrl = null, stylesheets = null }) {
return renderShadow(<Projects username={username} routes={routes} />, { target, baseUrl, stylesheets });
}

export function projectsBrowser({ target, apiUrl, baseUrl = null, stylesheets = null }) {
return renderShadow(<ProjectsBrowser api_url={apiUrl} />, { target, baseUrl, stylesheets });
}

export function publicationsBrowser({ target, routes, baseUrl = null, stylesheets = null }) {
return renderShadow(<PublicationsBrowser routes={routes} />, { target, baseUrl, stylesheets });
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
  baseUrl = null,
  stylesheets = null,
}) {
  const store = createStore();

return renderShadow(
    <JotaiProvider store={store}>
      <HydrateAtoms
        values={
          new Map([
            [publicationIdAtom, publicationId],
            [authenticityTokenAtom, authenticityToken],
            [routesAtom, mergeRoutes(routes)],
          ])
        }
      >
        <PublicationEdit />
      </HydrateAtoms>
    </JotaiProvider>,
    { target, baseUrl, stylesheets },
  );
}

export function publicationsSelect({
  authenticityToken,
  routes,
  selectedPublicationIds,
  target,
  usernames,
  baseUrl = null,
  stylesheets = null,
}) {
return renderShadow(
    <PublicationsSelect
      authenticityToken={authenticityToken}
      routes={routes}
      selectedPublicationIds={selectedPublicationIds}
      usernames={usernames}
    />,
    { target, baseUrl, stylesheets },
  );
}

export function onRampsResourceCatalog({
  target,
  onRamps,
  baseUrl = null,
  stylesheets = null,
}) {
return renderShadow(
    <OnRampsResourceCatalog onRamps={onRamps} baseUrl={baseUrl} />,
    { target, baseUrl, stylesheets },
  );
}

export function myPublications({
  authenticityToken,
  routes,
  target,
  username,
  showUpdatePublications,
  baseUrl = null,
  stylesheets = null,
}) {
return renderShadow(
    <MyPublications
      authenticityToken={authenticityToken}
      routes={routes}
      username={username}
      showUpdatePublications={showUpdatePublications}
    />,
    { target, baseUrl, stylesheets },
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
  baseUrl = null,
  stylesheets = null,
}) {
return renderShadow(
    <ResourceCatalog
      apiUrl={apiUrl}
      excludedCategories={excludedCategories}
      excludedFilters={excludedFilters}
      excludedResources={excludedResources}
      allowedCategories={allowedCategories}
      allowedFilters={allowedFilters}
    />,
    { target, baseUrl, stylesheets },
  );
}

export function keywords({ allocationTypes, target, baseUrl = null, stylesheets = null }) {
return renderShadow(<Keywords allocationTypes={allocationTypes} />, {
    target,
    baseUrl,
    stylesheets,
  });
}

export function supportingGrants({
  target,
  baseUrl = null,
  stylesheets = null,
  ...props
}) {
return renderShadow(<SupportingGrantsSection {...props} />, {
    target,
    baseUrl,
    stylesheets,
  });
}
