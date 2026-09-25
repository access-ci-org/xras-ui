# XRAS User Interface Components

User interface components for XRAS implemented in JavaScript/TypeScript using React, [Jotai](https://jotai.org) for state, and [Tailwind CSS](https://tailwindcss.com) for styling.

## Resource Catalog

This component provides a user interface to browse available Resources and their features, with the ability to filter the list for easier browsing.

### Example

```html
<div id="resource-catalog-react"></div>
<script type="module">
  import { resourceCatalog } from "https://esm.sh/@xras/ui@0.35.3?exports=resourceCatalog";
  resourceCatalog({
    apiUrl: "/path/to/catalog.json",
    allowedCategories: [],
    allowedFilters: [],
    excludedCategories: [],
    excludedFilters: [],
    target: document.getElementById("resource-catalog-react"),
  });
</script>
```

### Options

| Option               | Values                                                                                                                 | Required  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| `apiUrl`             | The URL for your Resource Catalog                                                                                      | **True**  |
| `allowedCategories`  | A list of filter **categories** that you want displayed. Ex: `["Resource Type", "Specialized Hardware"]`               | **False** |
| `allowedFilters`     | A list of filters you want users to see. Ex: `["GPU Compute"]`                                                         | **False** |
| `excludedCategories` | A list of filter **categories** that you want hidden from users. Ex: `["Specialized Support", "Specialized Hardware"]` | **False** |
| `excludedFilters`    | A list of filters that you want hidden from users. Ex: `["ACCESS Allocated", "ACCESS OnDemand"]`                       | **False** |
| `excludedResources`  | A list of Resources that you want hidden from users. Ex: `["ACCESS Credits"]`                                          | **False** |
| `target`             | The DOM element where the component will be rendered.                                                                  | **True**  |

Note: Avoid combining `allowedCategories` and `excludedCategories`, or `allowedFilters` and `excludedFilters`. If an invalid combination is found, it will default to what is specified in the `allowed*` options

## Supporting Grants field

There are two ways to embed the supporting grants editor, depending on how the surrounding form is built.

### As a form-associated custom element

`<supporting-grants-field>` participates in an ancestor `<form>`'s native submission and constraint validation like any other input, even though its fields live in a shadow root. This is the fit for a server-rendered form (for example, a Rails form) that expects a plain field among its other inputs.

```html
<form>
  <supporting-grants-field name="supporting_grants"></supporting-grants-field>
</form>
<script type="module">
  import { defineSupportingGrantsElement } from "https://esm.sh/@xras/ui@0.35.3?exports=defineSupportingGrantsElement";

  await defineSupportingGrantsElement();

  const field = document.querySelector("supporting-grants-field");
  // Too complex for HTML attributes, so set as properties before the
  // element is inserted into the document — they're only read once, in
  // connectedCallback.
  field.fundingAgencies = [{ id: 1, name: "National Science Foundation" }];
  field.fosTypes = [{ id: 1, name: "Computer Science" }];
</script>
```

`defineSupportingGrantsElement(tagName?)` takes an optional custom tag name (default `supporting-grants-field`) and polyfills `ElementInternals` first on browsers that lack it natively (Safari < 16.4, Firefox < 93, Chrome/Edge < 77). The element also accepts `baseUrl` and `stylesheets` properties with the same meaning as the mount functions' options, described below.

### As a mount function

`supportingGrants` follows the same `target`-based pattern as the library's other components, driving an external form (or any other state) through the `onChange`, `onValidityChange`, and `setExternalSubmit` callbacks instead of participating in a native `<form>`:

```html
<div id="supporting-grants-react"></div>
<script type="module">
  import { supportingGrants } from "https://esm.sh/@xras/ui@0.35.3?exports=supportingGrants";
  supportingGrants({
    target: document.getElementById("supporting-grants-react"),
    fundingAgencies: [{ id: 1, name: "National Science Foundation", abbr: "NSF" }],
    fosTypes: [{ id: 1, name: "Computer Science" }],
    onChange: ({ grants, includeSupportingGrants }) => {
      /* keep an external representation of the data in sync */
    },
    onValidityChange: (isValid) => {
      /* gate an external submit action on the current state */
    },
  });
</script>
```

## CSS

The components carry no Bootstrap dependency and require no CSS setup on the host page. Every mount function (and the `supporting-grants-field` custom element) renders into its own isolated [Shadow DOM](#shadow-dom) and, by default, automatically links the stylesheets it needs — `tailwind.css`, the compiled component styles, and the ACCESS theme palette — resolved from the URL of the `@xras/ui` module itself. The host page's styles never leak in, and the components' styles never leak out.

```html
<div id="resource-catalog-react"></div>
<script type="module">
  import { resourceCatalog } from "https://esm.sh/@xras/ui@0.35.3?exports=resourceCatalog";
  resourceCatalog({
    apiUrl: "/path/to/catalog.json",
    target: document.getElementById("resource-catalog-react"),
  });
</script>
```

Two options let you override where those stylesheets come from, if you're self-hosting `dist/` somewhere other than where the JS module was loaded from:

- `baseUrl` — the base URL the default stylesheet hrefs are resolved against. Defaults to the directory the `@xras/ui` module itself was loaded from.
- `stylesheets` — an explicit list of stylesheet URLs to link into the shadow root instead of the defaults.

The web font is the one exception: Chromium ignores `@font-face` rules declared inside a shadow tree, so every mount function adds that one link to the document `<head>` itself instead.

### Shadow DOM

Every component is styled entirely with Tailwind, whose reset lives in a cascade layer and so loses to any unlayered rules on the host page. Components therefore render in the shadow DOM unconditionally — pass the host element as `target` and the mount function attaches the shadow root for you, as in the examples above.

Mount functions build the shadow root for you from `baseUrl`/`stylesheets` as needed, but a host page that wants to inject additional stylesheets beyond those — its own icon font, say — can build the shadow root itself with the `shadowTarget` helper and pass the result as `target`:

```html
<div id="projects-react"></div>
<script type="module">
  import {
    projects,
    shadowTarget,
  } from "https://esm.sh/@xras/ui@0.35.3?exports=projects,shadowTarget";
  projects({
    target: shadowTarget(document.getElementById("projects-react"), {
      extraStylesheets: ["/fonts/icons.css"],
    }),
    username: "myuser",
    routes: { projects_path: () => "/projects" },
  });
</script>
```

Every mount function returns an `unmount` function. A host page that tears down
the markup around a component — a modal, a turbo-style page swap — should call
it, so the component's effects, timers and in-flight requests stop instead of
running on against detached DOM:

```html
<script type="module">
  import { projects } from "https://esm.sh/@xras/ui@0.35.3?exports=projects";
  const unmount = projects({
    target: document.getElementById("projects-react"),
    username: "myuser",
    routes: { projects_path: () => "/projects" },
  });
  // Later, before removing #projects-react from the page:
  unmount();
</script>
```

It unmounts React and nothing else: the shadow root and the stylesheet links
injected into it stay, since `attachShadow` can't be undone and the web font
link in the document head is shared by every mount on the page. So it's a
teardown, not a reset — mounting again wants a fresh host element.

Against the Vite dev server there is no `dist`, so `shadowTarget` links the sources the dev server can serve (`tailwind.css` and `bootstrap/access.scss`) and copies in the `<style>` tags Vite injects into the document head — CSS modules only exist in that form during development, and a shadow tree can't see the document head.

## Testing

Tests run on [Vitest](https://vitest.dev) with [Testing Library](https://testing-library.com) and [MSW](https://mswjs.io) for mocked network requests, in a jsdom environment. They're colocated with the source they cover, as `*.test.ts`/`*.test.tsx` files next to the module under test (for example, `src/shared/helpers/utils.test.ts` next to `src/shared/helpers/utils.tsx`); shared test setup and helpers live under `src/test/`.

```sh
npm test              # run the suite once
npm run test:watch    # re-run on file changes
npm run test:coverage # run once and print a coverage report
```

`npm run typecheck` runs the TypeScript compiler without emitting output, which is also useful on its own while iterating. CI (`.github/workflows/ci.yml`) runs `lint`, `typecheck`, `test:coverage`, and `build` on every pull request.
