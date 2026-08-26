import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes } from "@/shared/routes";
import PublicationsBrowser from "./PublicationsBrowser";

// The browse view mounts, fires `getPublicationsAtom` and `getFiltersAtom`,
// and had nowhere to render an error: unlike MyPublications and
// PublicationsSelect it never included PublicationsAlerts. So a failed search
// rendered as an empty result list - identical to "nothing matched your
// filters", which is the one outcome a user can't tell apart from a real
// answer.
describe("PublicationsBrowser", () => {
  it("reports failures from both mount fetches instead of rendering an empty list", async () => {
    render(<PublicationsBrowser />);

    expect(
      await screen.findByText("Unable to load publications. Please try again."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Unable to load the publication filters. Please try again."),
    ).toBeInTheDocument();
  });

  it("shows no error when both mount fetches succeed", async () => {
    server.use(
      http.get(defaultRoutes.search_publications_path(), () =>
        HttpResponse.json({ publications: [], pagination: { current_page: 1, last_page: 1 } }),
      ),
      http.get(defaultRoutes.search_publications_filters_path(), () =>
        HttpResponse.json({ filters: { journals: [], publication_types: [] } }),
      ),
    );

    render(<PublicationsBrowser />);

    // Wait for the list to settle before asserting the *absence* of an error,
    // so this can't pass just by checking too early.
    await screen.findByText("No matching publications.");
    expect(screen.queryByText(/Unable to load/)).not.toBeInTheDocument();
  });
});
