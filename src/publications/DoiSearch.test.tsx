import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { useAppForm } from "@/components/form";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import DoiSearch from "./DoiSearch";
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
});
