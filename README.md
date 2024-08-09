# XRAS User Interface Components

User interface components for XRAS implemented in JavaScript using React.

## Resource Catalog

This component provides a user interface to browse available Resources and their features, with the ability to filter the list for easier browsing.

### Example

```html
<div id="resource-catalog-react"></div>
<script type="module">
  import { resourceCatalog } from "https://esm.sh/@xras/ui@0.1.3?exports=resourceCatalog";
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

## CSS

The XRAS user interface components rely on Bootstrap 5 styles as well as their own stylesheet. How these stylesheets should be included depends on whether the site already uses Bootstrap 5.

### Sites with Bootstrap 5

Sites that are already using Bootstrap 5 can simply add the component CSS in the document head:

```html
<link rel="stylesheet" href="https://esm.sh/@xras/ui@0.1.3/dist/xras-ui.css" />
```

### Sites without Bootstrap 5

Sites that do not use Bootstrap 5 should also include `bootstrap.css`:

```html
<link
  rel="stylesheet"
  href="https://esm.sh/@xras/ui@0.1.3/dist/bootstrap.css"
/>
<link rel="stylesheet" href="https://esm.sh/@xras/ui@0.1.3/dist/xras-ui.css" />
```

In order for the Bootstrap styles to be applied, the component target element needs to be wrapped in elements with Bootstrap classes. These classes act as a namespace for the Bootstrap classes to prevent conflicts with the rest of the site's CSS:

```html
<div class="bootstrap">
  <div class="bootstrap-variables">
    <div class="bootstrap-fonts">
      <div id="resource-catalog-react"></div>
    </div>
  </div>
</div>
```

The `bootstrap-variables` and `bootstrap-fonts` classes on the inner wrapper are used to apply Bootstrap's default CSS variables and fonts, respectively, to the components. These classes are optional and can be omitted if the site defines its own typography rules and Bootstrap CSS variables.

### Shadow DOM

The Bootstrap namespacing described in the previous section prevents the Bootstrap styles from interfering with the host site's styles, but it does not prevent the host site's stylesheet from applying to the components. For complete isolation of the components from the host site's styles, render the component in the shadow DOM using the `shadowTarget` helper function:

```html
<div id="resource-catalog-react"></div>
<script type="module">
  import {
    resourceCatalog,
    shadowTarget,
  } from "https://esm.sh/@xras/ui@0.1.3?exports=resourceCatalog,shadowTarget";
  resourceCatalog({
    apiUrl: "/path/to/catalog.json",
    target: shadowTarget(document.getElementById("resource-catalog-react")),
  });
</script>
```

When using the shadow DOM, the stylesheets are injected into the shadow root by `shadowTarget` and do not need to be added to the document head.
