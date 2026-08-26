import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { useAppForm } from "@/components/form";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import DoiSearch from "./DoiSearch";
import { errorsAtom } from "./atoms";
import type { PublicationFormValues } from "./PublicationForm";

function Wrapper({ store }: { store: ReturnType<typeof createStore> }) {
  const form = useAppForm({
    defaultValues: {
      publication_type: "",
      title: "",
      publication_year: "",
      publication_month: "",
      doi: "10.1000/example",
      fields: [],
      authors: [],
      tags: [],
      resourceIds: [],
      resourcesNoneSelected: false,
      extraFields: {},
    } as PublicationFormValues,
    onSubmit: async () => {},
  });

  return (
    <Provider store={store}>
      <DoiSearch form={form} />
      {/* Surfaces the form's internal title state so the test can observe
          whether `doiLookup` (src/publications/DoiSearch.tsx) actually
          landed a successful response, without reaching into the form
          instance directly. */}
      <form.Subscribe selector={(state) => state.values.title}>
        {(title) => <div data-testid="title">{title}</div>}
      </form.Subscribe>
    </Provider>
  );
}

// DoiSearch reads its lookup URL via `useAtomValue(routesAtom)` (task #1 of
// the routes-injection refactor), not the `config.routes` singleton.
// `publications_lookup_path` is a Rails-supplied route with no entry in
// `defaultRoutes` (src/shared/routes.ts) at all, so this also proves the
// component is reading whatever was hydrated onto its store rather than
// falling through to some stale default.
describe("DoiSearch", () => {
  it("fetches the DOI lookup route hydrated onto the store, not a default", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("https://example.test/hydrated/lookup", () =>
        HttpResponse.json({ title: "Hydrated Title", type: "article-journal", authors: [] }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      publications_lookup_path: () => "https://example.test/hydrated/lookup",
    });

    render(<Wrapper store={store} />);

    await user.click(screen.getByText("Lookup Publication"));

    expect(await screen.findByTestId("title")).toHaveTextContent("Hydrated Title");
  });

  // `fetch` resolves for a 4xx, so without the explicit `response.ok` check
  // the error body was merged into the form as though it were a publication -
  // a lookup for an unknown DOI silently overwrote the fields the user had
  // already typed. The catch was always there; it just never fired for
  // anything that parsed as JSON.
  it("reports a lookup failure instead of merging a JSON error body into the form", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("https://example.test/hydrated/lookup", () =>
        HttpResponse.json({ title: "Not Found", type: "error" }, { status: 404 }),
      ),
    );

    const store = createStore();
    store.set(routesAtom, {
      ...defaultRoutes,
      publications_lookup_path: () => "https://example.test/hydrated/lookup",
    });

    render(<Wrapper store={store} />);

    await user.click(screen.getByText("Lookup Publication"));

    // Asserted on the store rather than the DOM: this Wrapper is just the
    // component plus a form, with no PublicationsAlerts to render into.
    await waitFor(() => expect(store.get(errorsAtom)).toHaveLength(1));
    expect(store.get(errorsAtom)[0].message).toBe(
      "Unable to retrieve publication. Double check your DOI, or continue entering information manually.",
    );

    // The whole point: the 404 body's "Not Found" never reached the form.
    expect(screen.getByTestId("title")).toHaveTextContent("");
  });
});
