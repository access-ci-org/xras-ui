import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes } from "@/shared/routes";
import PublicationEdit from "./PublicationEdit";
import { addErrorAtom } from "./atoms";

// PublicationEdit fires `getPublicationDataAtom` on mount and shows a spinner
// until `dataLoadedAtom` flips. Nothing ever flips it on failure, so before
// this fix a failed load spun for as long as the modal stayed open with no
// indication that anything had gone wrong - the atom had no try/catch, so the
// rejection escaped as an unhandled promise rejection rather than reaching the
// user.
//
// The error surface has to live in this component rather than being left to
// the caller: this renders in the body of the edit modal, and the page-level
// PublicationsAlerts (MyPublications) sits behind the modal's backdrop.
describe("PublicationEdit", () => {
  it("shows the error instead of spinning forever when the publication fails to load", async () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <PublicationEdit />
      </Provider>,
    );

    // The spinner is still right *while* the request is outstanding.
    expect(screen.getByRole("status")).toBeInTheDocument();

    expect(
      await screen.findByText("Unable to load this publication. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // The other half: errors raised *after* the form is up - DoiSearch's lookup
  // failure and PublicationForm's own validation alert - also had nowhere to
  // render, since the page-level PublicationsAlerts sits behind the modal
  // backdrop. They now appear above the form.
  it("shows an error raised while the form is open, above the form", async () => {
    server.use(
      http.get(defaultRoutes.publication_path("new.json"), () =>
        HttpResponse.json({
          publication: { publication_type: "", title: "", authors: [], fields: [] },
          publication_types: [],
        }),
      ),
    );

    const store = createStore();
    render(
      <Provider store={store}>
        <PublicationEdit />
      </Provider>,
    );

    // Wait for the form itself, so this isn't asserting against the spinner.
    expect(await screen.findByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.queryByText(/Unable to retrieve publication/)).not.toBeInTheDocument();

    act(() => store.set(addErrorAtom, "Unable to retrieve publication. Try again."));

    const alert = await screen.findByText("Unable to retrieve publication. Try again.");
    // Still the form, not replaced by the error.
    const title = screen.getByLabelText(/Title/);
    expect(title).toBeInTheDocument();

    // "At the top": the alert precedes the form in document order, so it lands
    // between the modal header and the scrollable body rather than somewhere
    // inside the fields.
    expect(alert.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
