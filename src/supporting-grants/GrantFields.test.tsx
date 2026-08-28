import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { useAppForm } from "@/components/form";
import { GrantFields } from "./GrantFields";
import { fosTypesAtom, fundingAgenciesAtom } from "./atoms";
import type { SupportingGrant, SupportingGrantsState } from "./types";

const AWARD_API = /research\.gov\/awardapi-service/;

const AGENCIES = [
  { id: 1, name: "National Science Foundation", abbr: "NSF" },
  { id: 2, name: "Department of Energy", abbr: "DOE" },
];
const FOS_TYPES = [{ id: 12, name: "Computer Science" }];

function grant(overrides: Partial<SupportingGrant> = {}): SupportingGrant {
  return {
    fundingAgencyId: 1,
    grantNumber: "",
    isPending: null,
    title: "",
    piName: "",
    beginDate: "",
    endDate: "",
    primaryFosTypeId: null,
    awardedAmount: "",
    awardedUnits: "Dollars",
    programOfficerName: "",
    programOfficerEmail: "",
    comments: "",
    ...overrides,
  };
}

// The fields themselves are declarative wrappers around form.AppField; what
// is worth testing here is the behaviour GrantFields adds on top of them -
// the NSF autofill on blur, the currency reformat on blur, and which labels
// pick up a required marker once the grant is no longer pending.
function renderFields({
  values = grant(),
  onRemove = vi.fn(),
}: { values?: SupportingGrant; onRemove?: () => void } = {}) {
  const store = createStore();
  store.set(fundingAgenciesAtom, AGENCIES);
  store.set(fosTypesAtom, FOS_TYPES);

  function Harness() {
    const form = useAppForm({
      defaultValues: {
        includeSupportingGrants: true,
        grants: [values],
      } as SupportingGrantsState,
      onSubmit: () => {},
    });
    return <GrantFields form={form} index={0} onRemove={onRemove} />;
  }

  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );

  return { onRemove };
}

// The field ids are the tanstack-form paths, which contain brackets and dots.
// getElementById takes them literally, where a CSS selector would not.
function field(name: string) {
  return document.getElementById(`grants[0].${name}`) as HTMLInputElement;
}

function labelFor(name: string) {
  return document.querySelector(`label[for="grants[0].${name}"]`)!;
}

async function blurGrantNumber(user: ReturnType<typeof userEvent.setup>) {
  await user.click(field("grantNumber"));
  await user.tab();
}

function award(overrides: Record<string, unknown> = {}) {
  return {
    title: "A Study of Studies",
    pdPIName: "Ada Lovelace",
    startDate: "03/01/2024",
    expDate: "02/28/2027",
    fundsObligatedAmt: "500000",
    poName: "Grace Hopper",
    poEmail: "ghopper@nsf.gov",
    ...overrides,
  };
}

function serveAward(body: Record<string, unknown> = { response: { award: [award()] } }) {
  const requests: URL[] = [];
  server.use(
    http.get(AWARD_API, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(body);
    }),
  );
  return requests;
}

describe("GrantFields", () => {
  it("renders every grant field", () => {
    renderFields();

    for (const label of [
      "Funding Agency",
      "Grant Number",
      "Grant Title",
      "PI Name",
      "Start Date",
      "End Date",
      "Field of Science",
      "Awarded Amount",
      "Program Officer Name",
      "Program Officer Email",
      "Explanation",
    ]) {
      expect(screen.getByText(new RegExp(`^${label}\\*?$`))).toBeInTheDocument();
    }
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderFields();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  describe("required markers", () => {
    it("leaves the award details optional while the pending question is unanswered", () => {
      renderFields();

      expect(labelFor("beginDate").textContent).toBe("Start Date");
      expect(labelFor("endDate").textContent).toBe("End Date");
      expect(labelFor("awardedAmount").textContent).toBe("Awarded Amount");
      // The fields that are required regardless, for contrast.
      expect(labelFor("title").textContent).toBe("Grant Title*");
      expect(labelFor("primaryFosTypeId").textContent).toBe("Field of Science*");
    });

    it("marks them required once the grant is answered as awarded", async () => {
      const user = userEvent.setup();
      renderFields();

      await user.click(screen.getByRole("radio", { name: "No" }));

      await waitFor(() => expect(labelFor("beginDate").textContent).toBe("Start Date*"));
      expect(labelFor("endDate").textContent).toBe("End Date*");
      expect(labelFor("awardedAmount").textContent).toBe("Awarded Amount*");
    });

    it("keeps them optional for a grant that is still pending", async () => {
      const user = userEvent.setup();
      renderFields();

      await user.click(screen.getByRole("radio", { name: "Yes" }));

      expect(labelFor("awardedAmount").textContent).toBe("Awarded Amount");
    });
  });

  describe("the awarded amount", () => {
    it("is reformatted as currency when the field is blurred", async () => {
      const user = userEvent.setup();
      renderFields();

      await user.type(field("awardedAmount"), "500000");
      await user.tab();

      await waitFor(() => expect(field("awardedAmount")).toHaveValue("$500,000.00"));
    });

    it("leaves an entry with no number in it as typed, for the schema to flag", async () => {
      const user = userEvent.setup();
      renderFields();

      await user.type(field("awardedAmount"), "half a million");
      await user.tab();

      await waitFor(() => expect(field("awardedAmount")).toHaveValue("half a million"));
    });
  });

  describe("the NSF lookup on blurring the grant number", () => {
    it("fills in the empty fields from the award record", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderFields({ values: grant({ grantNumber: "1234567" }) });

      await blurGrantNumber(user);

      await waitFor(() => expect(field("title")).toHaveValue("A Study of Studies"));
      expect(field("piName")).toHaveValue("Ada Lovelace");
      // NSF sends MM/DD/YYYY; the date fields want ISO.
      expect(field("beginDate")).toHaveValue("2024-03-01");
      expect(field("endDate")).toHaveValue("2027-02-28");
      // And the amount arrives unformatted.
      expect(field("awardedAmount")).toHaveValue("$500,000.00");
      expect(field("programOfficerName")).toHaveValue("Grace Hopper");
      expect(field("programOfficerEmail")).toHaveValue("ghopper@nsf.gov");
      expect(requests).toHaveLength(1);
    });

    it("answers the pending question as No, since an award record exists", async () => {
      const user = userEvent.setup();
      serveAward();
      renderFields({ values: grant({ grantNumber: "1234567" }) });

      await blurGrantNumber(user);

      await waitFor(() => expect(screen.getByRole("radio", { name: "No" })).toBeChecked());
    });

    it("does not overwrite an answer the user has already given", async () => {
      const user = userEvent.setup();
      serveAward();
      renderFields({ values: grant({ grantNumber: "1234567", isPending: true }) });

      await blurGrantNumber(user);

      await waitFor(() => expect(field("title")).toHaveValue("A Study of Studies"));
      expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    });

    it("does not overwrite fields the user has already typed into", async () => {
      // The whole point of setIfEmpty: the lookup fires on every blur of the
      // grant number, including ones after the user has edited the autofilled
      // values, and must not undo their edits.
      const user = userEvent.setup();
      serveAward();
      renderFields({
        values: grant({ grantNumber: "1234567", title: "My own title", piName: "" }),
      });

      await blurGrantNumber(user);

      await waitFor(() => expect(field("piName")).toHaveValue("Ada Lovelace"));
      expect(field("title")).toHaveValue("My own title");
    });

    it("strips non-digits out of the grant number before looking it up", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderFields({ values: grant({ grantNumber: "NSF-123 4567" }) });

      await blurGrantNumber(user);

      await waitFor(() => expect(requests).toHaveLength(1));
      expect(requests[0].pathname).toBe("/awardapi-service/v1/awards/1234567.json");
    });

    it("shows a not-found message when the award number matches nothing", async () => {
      const user = userEvent.setup();
      serveAward({ response: { award: [] } });
      renderFields({ values: grant({ grantNumber: "0000000" }) });

      await blurGrantNumber(user);

      expect(
        await screen.findByText("Could not find an NSF grant with this number."),
      ).toBeInTheDocument();
      expect(field("title")).toHaveValue("");
    });

    it("clears a previous not-found message on the next blur, even when no lookup follows", async () => {
      // The status reset has to happen at the top of the handler, before the
      // early returns: a blur that looks nothing up (here, because the number
      // has been cleared) still has to take down a message about a number
      // that is no longer in the field.
      const user = userEvent.setup();
      serveAward({ response: { award: [] } });
      renderFields({ values: grant({ grantNumber: "0000000" }) });

      await blurGrantNumber(user);
      await screen.findByText("Could not find an NSF grant with this number.");

      await user.clear(field("grantNumber"));
      await user.tab();

      await waitFor(() =>
        expect(
          screen.queryByText("Could not find an NSF grant with this number."),
        ).not.toBeInTheDocument(),
      );
    });

    // Each of these serves a *working* award endpoint on purpose. Registering
    // no handler would make an unwanted request fail at the MSW catch-all and
    // leave the fields empty anyway, so the assertions would hold whether or
    // not the guard exists. With the endpoint live, a request that should not
    // have been made visibly fills the form in.
    it("does not look anything up for a non-NSF funding agency", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderFields({ values: grant({ fundingAgencyId: 2, grantNumber: "1234567" }) });

      await blurGrantNumber(user);

      expect(requests).toHaveLength(0);
      expect(field("title")).toHaveValue("");
    });

    it("does not look anything up before a funding agency has been chosen", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderFields({ values: grant({ fundingAgencyId: null, grantNumber: "1234567" }) });

      await blurGrantNumber(user);

      expect(requests).toHaveLength(0);
      expect(field("title")).toHaveValue("");
    });

    it("does not look anything up when the number has no digits in it", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderFields({ values: grant({ grantNumber: "pending" }) });

      await blurGrantNumber(user);

      expect(requests).toHaveLength(0);
      expect(field("title")).toHaveValue("");
    });
  });
});
