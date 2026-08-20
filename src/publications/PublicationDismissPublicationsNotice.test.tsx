import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import PublicationDismissPublicationsNotice from "./PublicationDismissPublicationsNotice";
import { showUpdatePublicationsAtom } from "./atoms";

// The dismiss-notice button (src/publications/PublicationDismissPublicationsNotice.tsx)
// is a thin wrapper: render nothing unless showUpdatePublicationsAtom is true,
// and clicking calls dismissUpdatePublicationsNoticeAtom, which the atoms
// test suite (src/publications/atoms.test.ts) already exercises for its own
// fetch/error behavior. This only needs to prove the component wires that up
// correctly end to end, including hiding itself once the dismissal succeeds.
describe("PublicationDismissPublicationsNotice", () => {
  it("renders nothing when there is no update-your-publications notice to show", () => {
    const store = createStore();
    store.set(showUpdatePublicationsAtom, false);
    const { container } = render(
      <Provider store={store}>
        <PublicationDismissPublicationsNotice />
      </Provider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("dismisses the notice and hides the button on a successful response", async () => {
    server.use(
      http.post(defaultRoutes.publications_dismiss_notice_path(), () =>
        HttpResponse.json({ success: true }),
      ),
    );
    const user = userEvent.setup();
    const store = createStore();
    store.set(routesAtom, defaultRoutes);
    store.set(showUpdatePublicationsAtom, true);

    render(
      <Provider store={store}>
        <PublicationDismissPublicationsNotice />
      </Provider>,
    );

    const button = screen.getByText("I HAVE NO NEW PUBLICATIONS");
    await user.click(button);

    // The button unmounts once showUpdatePublicationsAtom flips to false;
    // waitFor rather than a bare assertion since the dismissal is async.
    await vi.waitFor(() =>
      expect(screen.queryByText("I HAVE NO NEW PUBLICATIONS")).not.toBeInTheDocument(),
    );
  });

  it("keeps the notice visible when the dismissal request fails server-side", async () => {
    server.use(
      http.post(defaultRoutes.publications_dismiss_notice_path(), () =>
        HttpResponse.json({ success: false }),
      ),
    );
    const user = userEvent.setup();
    const store = createStore();
    store.set(routesAtom, defaultRoutes);
    store.set(showUpdatePublicationsAtom, true);

    render(
      <Provider store={store}>
        <PublicationDismissPublicationsNotice />
      </Provider>,
    );

    await user.click(screen.getByText("I HAVE NO NEW PUBLICATIONS"));

    // Wait a tick for the fetch/json promise chain to settle.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText("I HAVE NO NEW PUBLICATIONS")).toBeInTheDocument();
  });
});
