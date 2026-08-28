import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes } from "@/shared/routes";
import PublicationForm from "./PublicationForm";
import {
  authenticityTokenAtom,
  editProjectsAtom,
  errorsAtom,
  publicationAtom,
  publicationTypesAtom,
  savingAtom,
  selectedResourcesAtom,
  showSavedAtom,
} from "./atoms";
import type { EditablePublication } from "./types";

// The other half of `onSubmit`, now that payload construction lives in
// `helpers/request.ts`: that the request actually goes out, and that the
// saving/saved/error atoms end up where they should. This is the part that
// genuinely needs the network mocked, and it is also what proves the extracted
// builder is really wired in rather than merely correct in isolation.
function publication(overrides: Partial<EditablePublication> = {}): EditablePublication {
  return {
    publication_type: "Journal Article",
    title: "A paper",
    // Deliberately a number and a month name, so the form's normalizers are in
    // the path: the payload should carry "2024" and "6".
    publication_year: 2024,
    publication_month: "June",
    doi: "10.1234/abcd",
    authors: [{ first_name: "Ada", last_name: "Lovelace" }],
    fields: [{ csl_field_name: "container-title", name: "Journal", field_value: "Nature" }],
    ...overrides,
  };
}

function renderForm(overrides: Partial<EditablePublication> = {}) {
  const store = createStore();
  store.set(publicationAtom, publication(overrides));
  store.set(publicationTypesAtom, [
    {
      publication_type: "Journal Article",
      fields: [{ csl_field_name: "container-title", name: "Journal" }],
    },
  ]);
  // `canSave` needs a selected project and at least one resource, and
  // `selectedProjectsAtom` derives from `editProjectsAtom` - the unselected
  // project is here to prove only the selected one is sent.
  store.set(editProjectsAtom, [
    { grant_number: "PHY123456", title: "Chosen", selected: true },
    { grant_number: "CHE999999", title: "Not chosen", selected: false },
  ]);
  store.set(selectedResourcesAtom, [7]);
  store.set(authenticityTokenAtom, "token-from-atom");

  render(
    <Provider store={store}>
      <PublicationForm />
    </Provider>,
  );

  return store;
}

const save = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Save Publication" }));

describe("PublicationForm submit", () => {
  it("posts the built request when saving a new publication", async () => {
    const user = userEvent.setup();
    let body: any;

    server.use(
      http.post(defaultRoutes.publications_path(), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({});
      }),
      // A successful create resets the edit state and reloads a blank
      // publication, so this GET is part of the happy path.
      http.get(defaultRoutes.publication_path("new.json"), () =>
        HttpResponse.json({
          publication: { publication_type: "", title: "", authors: [], fields: [] },
          publication_types: [],
        }),
      ),
    );

    const store = renderForm();
    await save(user);

    await waitFor(() => expect(body).toBeDefined());
    expect(body.authenticity_token).toBe("token-from-atom");
    expect(body.publication).toMatchObject({
      title: "A paper",
      publication_year: "2024",
      publication_month: "6",
      doi: "10.1234/abcd",
      peer_reviewed: true,
      access_staff_publication: false,
    });
    expect(body.authors).toEqual([{ first_name: "Ada", last_name: "Lovelace", order: 0 }]);
    expect(body.resources).toEqual([{ resource_id: 7 }]);
    expect(body.projects).toEqual([
      { grant_number: "PHY123456", title: "Chosen", selected: true },
    ]);

    await waitFor(() => expect(store.get(showSavedAtom)).toBe(true));
    expect(store.get(savingAtom)).toBe(false);
    expect(store.get(errorsAtom)).toEqual([]);
  });

  it("hands the loaded peer_reviewed value back instead of defaulting it", async () => {
    const user = userEvent.setup();
    let body: any;

    server.use(
      http.patch(defaultRoutes.publication_path(42), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({});
      }),
    );

    // The whole point of carrying the field: an existing publication that is
    // not peer reviewed must not be silently promoted on save. The form shows
    // no control for it, so a test is the only thing watching.
    renderForm({ publication_id: 42, peer_reviewed: false });
    await save(user);

    await waitFor(() => expect(body).toBeDefined());
    expect(body.publication.peer_reviewed).toBe(false);
  });

  it("patches the publication's own path when editing an existing one", async () => {
    const user = userEvent.setup();
    let method: string | undefined;

    server.use(
      http.patch(defaultRoutes.publication_path(42), ({ request }) => {
        method = request.method;
        return HttpResponse.json({});
      }),
    );

    const store = renderForm({ publication_id: 42 });
    await save(user);

    await waitFor(() => expect(method).toBe("PATCH"));
    // No reset and no reload on an update - the form stays as it is, which is
    // why this test needs no GET handler.
    await waitFor(() => expect(store.get(showSavedAtom)).toBe(true));
    expect(store.get(publicationAtom)).not.toBeNull();
  });

  it("shows the missing-field alert and sends nothing when validation fails", async () => {
    const user = userEvent.setup();
    let requests = 0;

    server.use(
      http.post(defaultRoutes.publications_path(), () => {
        requests += 1;
        return HttpResponse.json({});
      }),
    );

    // A blank year passes the Save button's own `canSave` check - which only
    // looks at title, authors, projects and resources - and is caught by
    // `validateForm` instead. That gap is why both gates exist.
    const store = renderForm({ publication_year: null });
    await save(user);

    await waitFor(() => expect(store.get(errorsAtom)).toHaveLength(1));
    render(<>{store.get(errorsAtom)[0].message}</>);
    expect(screen.getByRole("alert")).toHaveTextContent("Publication Year");
    expect(requests).toBe(0);
    expect(store.get(savingAtom)).toBe(false);
  });

  it("reports a failed save and clears the saving flag", async () => {
    const user = userEvent.setup();

    server.use(
      http.post(defaultRoutes.publications_path(), () => new HttpResponse(null, { status: 500 })),
    );

    const store = renderForm();
    await save(user);

    await waitFor(() =>
      expect(store.get(errorsAtom)).toEqual([
        { id: expect.any(String), message: "There was an error saving this publication." },
      ]),
    );
    // The `finally` block is what makes this true; without it the form would be
    // stuck reporting "Saving...".
    expect(store.get(savingAtom)).toBe(false);
    expect(store.get(showSavedAtom)).toBe(false);
  });
});
