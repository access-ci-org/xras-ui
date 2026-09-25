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

// The grant number, dates, amount, and program officer fields only mount
// once the grant has been answered as no-longer-pending (see GrantFields'
// requireAwardDetails block) - so any test that needs to interact with them
// has to start from that answered state.
function awardedGrant(overrides: Partial<SupportingGrant> = {}): SupportingGrant {
  return grant({ isPending: false, ...overrides });
}

// The fields themselves are declarative wrappers around form.AppField; what
// is worth testing here is the behaviour GrantFields adds on top of them -
// which fields mount once the grant is no longer pending, the NSF grant
// number mask, the NSF autofill on blur, and the currency reformat on blur.
// applyNsfLock is passed straight through rather than defaulted here, so
// omitting it exercises GrantFields' own default (which is on).
function renderFields({
  values = grant(),
  onRemove = vi.fn(),
  applyNsfLock,
  showRemoveButton = true,
}: {
  values?: SupportingGrant;
  onRemove?: () => void;
  applyNsfLock?: boolean;
  showRemoveButton?: boolean;
} = {}) {
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
    return (
      <GrantFields
        form={form}
        index={0}
        onRemove={showRemoveButton ? onRemove : undefined}
        applyNsfLock={applyNsfLock}
      />
    );
  }

  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );

  return { onRemove };
}

async function selectFundingAgency(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("combobox", { name: /^Funding Agency\*?$/ }));
  await user.click(screen.getByRole("option", { name }));
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

// A number NSF has no record of. Distinct from serveAward's "found" default
// because the lock hangs on exactly this difference.
const NO_SUCH_AWARD = { response: { award: [] } };

// research.gov unreachable, as opposed to answering that it has no such
// award - the case nsfLockApplies swallows.
function serveAwardLookupFailure() {
  const requests: URL[] = [];
  server.use(
    http.get(AWARD_API, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.error();
    }),
  );
  return requests;
}

describe("GrantFields", () => {
  it("renders the fields that are always visible", () => {
    renderFields();

    for (const label of [
      "Is this grant pending?",
      "Funding Agency",
      "Grant Title",
      "PI Name",
      "Field of Science",
      "Explanation",
    ]) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(screen.getByText(new RegExp(`^${escaped}\\*?$`))).toBeInTheDocument();
    }
  });

  it("hides the award-detail fields until the grant is answered as no longer pending", () => {
    renderFields();

    for (const label of [
      "Grant Number",
      "Start Date",
      "End Date",
      "Awarded Amount",
      "Program Officer Name",
      "Program Officer Email",
    ]) {
      expect(screen.queryByText(new RegExp(`^${label}\\*?$`))).not.toBeInTheDocument();
    }
  });

  it("keeps the award-detail fields hidden while the grant is still pending", () => {
    renderFields({ values: grant({ isPending: true }) });

    expect(screen.queryByText(/^Grant Number\*?$/)).not.toBeInTheDocument();
  });

  it("shows the award-detail fields, all required, once the grant is answered as awarded", async () => {
    const user = userEvent.setup();
    renderFields();

    await user.click(screen.getByRole("radio", { name: "No" }));

    await waitFor(() => expect(labelFor("grantNumber").textContent).toBe("Grant Number*"));
    expect(labelFor("beginDate").textContent).toBe("Start Date*");
    expect(labelFor("endDate").textContent).toBe("End Date*");
    expect(labelFor("awardedAmount").textContent).toBe("Awarded Amount*");
    expect(labelFor("programOfficerName").textContent).toBe("Program Officer Name*");
    expect(labelFor("programOfficerEmail").textContent).toBe("Program Officer Email*");
  });

  it("hides the award-detail fields again if the answer is switched back to pending", async () => {
    const user = userEvent.setup();
    renderFields();

    await user.click(screen.getByRole("radio", { name: "No" }));
    await waitFor(() => expect(labelFor("grantNumber").textContent).toBe("Grant Number*"));

    await user.click(screen.getByRole("radio", { name: "Yes" }));

    expect(screen.queryByText(/^Grant Number\*?$/)).not.toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderFields();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("does not render a remove button when onRemove is omitted", () => {
    // My Projects' single-grant modals (GrantEditModal.tsx, AddGrantModal.tsx)
    // never pass onRemove - there's nothing to remove a lone grant from.
    renderFields({ showRemoveButton: false });

    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  describe("grant number formatting per funding agency", () => {
    it("masks the grant number to digits only, up to 7 characters, for NSF", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant({ fundingAgencyId: 1 }), applyNsfLock: false });

      await user.type(field("grantNumber"), "ab12-3456789");

      expect(field("grantNumber")).toHaveValue("1234567");
    });

    it("allows up to 40 characters of any text for a non-NSF agency", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant({ fundingAgencyId: 2 }) });

      await user.type(field("grantNumber"), "DOE-Award-12345");

      expect(field("grantNumber")).toHaveValue("DOE-Award-12345");
    });

    it("clears the grant number when the agency is switched to NSF and the value isn't a valid NSF number", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant({ fundingAgencyId: 2, grantNumber: "DOE-12345" }) });

      await selectFundingAgency(user, "National Science Foundation");

      expect(field("grantNumber")).toHaveValue("");
    });

    it("keeps the grant number when switching to NSF if it's already a valid 7-digit number", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant({ fundingAgencyId: 2, grantNumber: "1234567" }) });

      await selectFundingAgency(user, "National Science Foundation");

      expect(field("grantNumber")).toHaveValue("1234567");
    });

    it("keeps the grant number when switching away from NSF", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant({ fundingAgencyId: 1, grantNumber: "1234567" }) });

      await selectFundingAgency(user, "Department of Energy");

      expect(field("grantNumber")).toHaveValue("1234567");
    });
  });

  describe("the awarded amount", () => {
    it("is reformatted as currency when the field is blurred", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant() });

      await user.type(field("awardedAmount"), "500000");
      await user.tab();

      await waitFor(() => expect(field("awardedAmount")).toHaveValue("$500,000.00"));
    });

    it("leaves an entry with no number in it as typed, for the schema to flag", async () => {
      const user = userEvent.setup();
      renderFields({ values: awardedGrant() });

      await user.type(field("awardedAmount"), "half a million");
      await user.tab();

      await waitFor(() => expect(field("awardedAmount")).toHaveValue("half a million"));
    });
  });

  describe("the NSF lookup on blurring the grant number", () => {
    // These reach the handler with a grant number already sitting in the
    // field, which is the one shape the lock interferes with: with it on (the
    // default) GrantFields checks that same number against NSF on mount, both
    // adding a request to the counts asserted here and - where NSF recognises
    // it - locking the field so a blur looks nothing up at all. Off, the blur
    // is the only lookup there is. The lock-on route through this same handler
    // - type a number, blur, autofill, then lock - is covered in the
    // applyNsfLock block below.
    const renderUnlocked = (values: SupportingGrant) =>
      renderFields({ values, applyNsfLock: false });

    it("fills in the empty fields from the award record", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderUnlocked(awardedGrant({ grantNumber: "1234567" }));

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

    it("does not overwrite fields the user has already typed into", async () => {
      // The whole point of setIfEmpty: the lookup fires on every blur of the
      // grant number, including ones after the user has edited the autofilled
      // values, and must not undo their edits.
      const user = userEvent.setup();
      serveAward();
      renderUnlocked(awardedGrant({ grantNumber: "1234567", title: "My own title", piName: "" }));

      await blurGrantNumber(user);

      await waitFor(() => expect(field("piName")).toHaveValue("Ada Lovelace"));
      expect(field("title")).toHaveValue("My own title");
    });

    it("strips non-digits out of the grant number before looking it up", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderUnlocked(awardedGrant({ grantNumber: "1234567" }));
      // Typed rather than set via defaultValues, since the NSF mask (see
      // "grant number formatting per funding agency" above) already strips
      // non-digits from anything the user types - this exercises the same
      // stripping the blur handler does on whatever reaches it.
      await user.clear(field("grantNumber"));
      await user.type(field("grantNumber"), "1234567");

      await blurGrantNumber(user);

      await waitFor(() => expect(requests).toHaveLength(1));
      expect(requests[0].pathname).toBe("/awardapi-service/v1/awards/1234567.json");
    });

    it("shows a not-found message when the award number matches nothing", async () => {
      const user = userEvent.setup();
      serveAward(NO_SUCH_AWARD);
      renderUnlocked(awardedGrant({ grantNumber: "0000000" }));

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
      serveAward(NO_SUCH_AWARD);
      renderUnlocked(awardedGrant({ grantNumber: "0000000" }));

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
      renderUnlocked(awardedGrant({ fundingAgencyId: 2, grantNumber: "1234567" }));

      await blurGrantNumber(user);

      expect(requests).toHaveLength(0);
      expect(field("title")).toHaveValue("");
    });

    it("does not look anything up before a funding agency has been chosen", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderUnlocked(awardedGrant({ fundingAgencyId: null, grantNumber: "1234567" }));

      await blurGrantNumber(user);

      expect(requests).toHaveLength(0);
      expect(field("title")).toHaveValue("");
    });

    it("does not look anything up when the number has no digits in it", async () => {
      const user = userEvent.setup();
      const requests = serveAward();
      renderUnlocked(awardedGrant({ fundingAgencyId: 2, grantNumber: "pending" }));

      await blurGrantNumber(user);

      expect(requests).toHaveLength(0);
      expect(field("title")).toHaveValue("");
    });
  });
});

// On everywhere unless a client rendering these components itself opts out -
// My Projects (GrantEditModal.tsx/AddGrantModal.tsx) and the submission form
// both leave it at its default. Nothing on the server enforces it.
//
// The lock's trigger is a *successful* NSF lookup, not merely an NSF agency
// with something in the grant number field, so every test here either serves
// the award endpoint or asserts that nothing was asked of it. Every fixture
// answers isPending as false up front, since the mount-time check reads the
// initial grant number/agency from form state regardless of what's on
// screen, but the disabled/enabled assertions below need the award-detail
// fields actually mounted to inspect.
describe("applyNsfLock", () => {
  it("locks every field but Field of Science and Explanation when NSF recognises the initial grant number", async () => {
    serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "1234567" }),
      applyNsfLock: true,
    });

    expect(await screen.findByText(/populated from NSF's records/)).toBeInTheDocument();
    expect(field("fundingAgencyId")).toBeDisabled();
    expect(field("grantNumber")).toBeDisabled();
    expect(field("title")).toBeDisabled();
    expect(field("piName")).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "No" })).toBeDisabled();
    expect(field("beginDate")).toBeDisabled();
    expect(field("endDate")).toBeDisabled();
    expect(field("awardedAmount")).toBeDisabled();
    expect(field("programOfficerName")).toBeDisabled();
    expect(field("programOfficerEmail")).toBeDisabled();
    // Only these two stay editable once the lock is engaged.
    expect(field("comments")).toBeEnabled();
  });

  // The lock would otherwise be a trap: grantNumber is one of the fields it
  // takes away, so a mistyped number would disable the only field that could
  // fix it - and the funding agency select with it.
  it("does not lock anything for a grant number NSF has no record of", async () => {
    const requests = serveAward(NO_SUCH_AWARD);
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "0000000" }),
      applyNsfLock: true,
    });

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
    expect(field("grantNumber")).toBeEnabled();
    expect(field("title")).toBeEnabled();
  });

  it("does not lock anything when the lookup itself fails", async () => {
    // research.gov being unreachable is not evidence that NSF has a record to
    // defer to, so it must not cost the user their fields.
    const requests = serveAwardLookupFailure();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "1234567" }),
      applyNsfLock: true,
    });

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
    expect(field("title")).toBeEnabled();
  });

  it("looks nothing up, and locks nothing, for an NSF grant with no grant number yet", async () => {
    // Otherwise a brand-new grant could never have its grant number typed
    // in: selecting NSF as the funding agency would instantly disable the
    // field before the user had a chance to enter one.
    const requests = serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "" }),
      applyNsfLock: true,
    });

    await waitFor(() => expect(field("grantNumber")).toBeEnabled());
    expect(requests).toHaveLength(0);
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
    expect(field("title")).toBeEnabled();
  });

  it("looks nothing up for a non-NSF initial funding agency", async () => {
    const requests = serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 2, grantNumber: "1234567" }),
      applyNsfLock: true,
    });

    await waitFor(() => expect(field("title")).toBeEnabled());
    expect(requests).toHaveLength(0);
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
  });

  it("is on when left at its default, so a recognised NSF grant locks without being asked to", async () => {
    serveAward();
    renderFields({ values: awardedGrant({ fundingAgencyId: 1, grantNumber: "1234567" }) });

    expect(await screen.findByText(/populated from NSF's records/)).toBeInTheDocument();
    expect(field("title")).toBeDisabled();
  });

  it("looks nothing up at all when a client opts out with false", async () => {
    const requests = serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "1234567" }),
      applyNsfLock: false,
    });

    await waitFor(() => expect(field("title")).toBeEnabled());
    expect(requests).toHaveLength(0);
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
  });

  // Checking on mount is not enough on its own: the grant number can arrive
  // before the agency does, which is the order the add-grant modal invites
  // (see AddGrantModal.test.tsx).
  it("locks the fields when the funding agency is changed to NSF and it recognises the grant number already present", async () => {
    const user = userEvent.setup();
    serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 2, grantNumber: "1234567" }),
      applyNsfLock: true,
    });
    expect(field("title")).toBeEnabled();

    await selectFundingAgency(user, "National Science Foundation");

    await waitFor(() => expect(field("title")).toBeDisabled());
    expect(screen.getByText(/populated from NSF's records/)).toBeInTheDocument();
  });

  it("does not lock the fields when the funding agency is changed to NSF but no grant number has been entered", async () => {
    const user = userEvent.setup();
    const requests = serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 2, grantNumber: "" }),
      applyNsfLock: true,
    });

    await selectFundingAgency(user, "National Science Foundation");

    expect(requests).toHaveLength(0);
    expect(field("title")).toBeEnabled();
    expect(field("grantNumber")).toBeEnabled();
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
  });

  it("keeps the funding agency itself locked once the lock engages, so it can't be switched away from NSF", async () => {
    // fundingAgencyId is one of the locked fields (see NSF_LOCKED_FIELDS), so
    // once the lock engages there's no UI path back out of it - matching the
    // combobox's disabled assertion in the first test in this block.
    serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "1234567" }),
      applyNsfLock: true,
    });

    await waitFor(() => expect(field("fundingAgencyId")).toBeDisabled());
  });

  it("still allows switching away from NSF before a grant number has locked it in", async () => {
    const user = userEvent.setup();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "" }),
      applyNsfLock: true,
    });
    expect(field("title")).toBeEnabled();

    await selectFundingAgency(user, "Department of Energy");

    expect(field("title")).toBeEnabled();
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
  });

  // Typing a grant number in for the first time (agency already NSF) only
  // engages the lock once the field is blurred, not on every keystroke.
  it("engages the lock on blurring a grant number NSF recognises, reusing that same lookup", async () => {
    const user = userEvent.setup();
    const requests = serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "" }),
      applyNsfLock: true,
    });
    expect(field("title")).toBeEnabled();

    await user.type(field("grantNumber"), "1234567");
    await blurGrantNumber(user);

    await waitFor(() => expect(field("title")).toBeDisabled());
    // The blur's autofill lookup is the same answer the lock needs, so it is
    // not asked for twice.
    expect(requests).toHaveLength(1);
  });

  it("leaves everything editable when the blurred grant number matches nothing", async () => {
    const user = userEvent.setup();
    serveAward(NO_SUCH_AWARD);
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "" }),
      applyNsfLock: true,
    });

    await user.type(field("grantNumber"), "0000000");
    await blurGrantNumber(user);

    await screen.findByText("Could not find an NSF grant with this number.");
    expect(field("grantNumber")).toBeEnabled();
    expect(field("title")).toBeEnabled();
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
  });

  // Once it does engage there is no way back out of it: grantNumber and
  // fundingAgencyId are both locked fields, so neither half of the trigger can
  // be edited to undo it. Reopening the form is the only reset, which is why
  // the trigger has to be right the first time.
  it("keeps the lock for the life of the form once NSF has confirmed the number", async () => {
    const user = userEvent.setup();
    serveAward();
    renderFields({
      values: awardedGrant({ fundingAgencyId: 1, grantNumber: "" }),
      applyNsfLock: true,
    });

    await user.type(field("grantNumber"), "1234567");
    await blurGrantNumber(user);
    await waitFor(() => expect(field("grantNumber")).toBeDisabled());

    expect(field("fundingAgencyId")).toBeDisabled();
    await user.type(field("grantNumber"), "9");
    expect(field("grantNumber")).toHaveValue("1234567");
  });
});
