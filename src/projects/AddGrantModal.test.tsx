import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { defaultRoutes, routesAtom } from "@/shared/routes";
import { ShadowRootProvider } from "@/lib/shadow-root";
import AddGrantModal from "./AddGrantModal";
import { apiStateAtom } from "./atoms";
import type { Request as RequestType } from "./types";

const GRANT_NUMBER = "TEST000001";
const REQUEST_ID = 555;
const SAVE_URL = "https://example.test/save-grants";

const AGENCIES = [
  { id: 10, name: "National Science Foundation", abbr: "NSF" },
  { id: 20, name: "Department of Energy", abbr: "DOE" },
];
const FOS_TYPES = [{ id: 5, name: "Computer Science" }];

function makeRequest(overrides: Partial<RequestType> = {}): RequestType {
  return {
    actions: [],
    allocationType: "Explore",
    allowedActions: {},
    endDate: "2026-12-31",
    entryDate: "2026-01-01",
    exchangeActionId: null,
    exchangeActionEditable: false,
    exchangeErrors: [],
    exchangeStatus: null,
    grantNumber: GRANT_NUMBER,
    grants: [],
    editGrantId: null,
    grantsStatus: null,
    isMaximize: false,
    requestId: REQUEST_ID,
    resources: [],
    resourcesReason: "",
    returnedForCorrections: false,
    returnedForCorrectionsNotes: "",
    showActionsModal: false,
    showAddGrantModal: true,
    showConfirmModal: false,
    showResourcesModal: false,
    startDate: "2025-01-01",
    status: "Active",
    timeStatus: "current",
    type: "New",
    usageDetail: null,
    usageDetailStatus: null,
    usesCredits: true,
    ...overrides,
  };
}

function makeStore(requestOverrides: Partial<RequestType> = {}) {
  const store = createStore();
  store.set(routesAtom, {
    ...defaultRoutes,
    projects_save_grants_path: () => SAVE_URL,
  });
  // The grants editor's select lists arrive with the projects themselves, in
  // apiState - see grantFundingAgenciesAtom in atoms.ts.
  store.set(apiStateAtom, {
    error: null,
    projectsList: [],
    projectListLoading: false,
    projects: {},
    requests: { [REQUEST_ID]: makeRequest(requestOverrides) },
    username: "testuser",
    fundingAgencies: AGENCIES,
    fosTypes: FOS_TYPES,
  });
  return store;
}

function renderAddGrantModal({ requestOverrides = {} }: { requestOverrides?: Partial<RequestType> } = {}) {
  const store = makeStore(requestOverrides);
  return {
    store,
    ...render(
      <Provider store={store}>
        <AddGrantModal grantNumber={GRANT_NUMBER} requestId={REQUEST_ID} />
      </Provider>,
    ),
  };
}

// The way main.jsx mounts My Projects on a real page: inside a shadow root,
// with focus already in the shadow tree (on the button that opened the modal)
// when the dialog autofocuses. Returns queries scoped to the shadow root,
// since `screen` only searches the light DOM.
function renderAddGrantModalInShadowRoot() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const shadowRoot = host.attachShadow({ mode: "open" });
  const target = document.createElement("div");
  const opener = document.createElement("button");
  shadowRoot.append(target, opener);
  opener.focus();

  render(
    <ShadowRootProvider target={target}>
      <Provider store={makeStore()}>
        <AddGrantModal grantNumber={GRANT_NUMBER} requestId={REQUEST_ID} />
      </Provider>
    </ShadowRootProvider>,
    { container: target },
  );
  return within(shadowRoot as unknown as HTMLElement);
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, comboboxName: string, optionName: string) {
  // Required fields' labels carry a trailing "*" (FormLabel's `required`
  // marker - see GrantFields.test.tsx's labelFor helper for the same thing),
  // which becomes part of the trigger's accessible name.
  await user.click(screen.getByRole("combobox", { name: new RegExp(`^${comboboxName}\\*?$`) }));
  // findByRole (not getByRole): the option list mounts into a Radix portal
  // after the click, one tick later. Every other Select in this codebase
  // sits directly in the test's own render tree, but this one opens inside a
  // Dialog on top of that, and under a full-suite run (many workers
  // competing for CPU) that extra portal can genuinely take longer than a
  // single synchronous query allows for - which showed up as intermittent
  // "unable to find option" failures that passed every time in isolation.
  await user.click(await screen.findByRole("option", { name: optionName }));
}

// Answers the pending question as Yes (still pending) deliberately: that's
// the one answer that keeps this minimal, since grantNumber, the dates, the
// awarded amount, and the program officer fields are all both hidden and
// unrequired while a grant is pending (see GrantFields.test.tsx and
// schema.test.ts). Uses the non-NSF agency too, so there's nothing here for
// GrantFields' NSF lookup to key off of even once a grant number exists.
async function fillOutMinimalGrant(user: ReturnType<typeof userEvent.setup>) {
  await selectOption(user, "Funding Agency", "Department of Energy");
  await user.type(screen.getByLabelText("Grant Title", { exact: false }), "A New Grant");
  await user.type(screen.getByLabelText("PI Name", { exact: false }), "Ada Lovelace");
  await user.click(screen.getByRole("radio", { name: "Yes" }));
  await selectOption(user, "Field of Science", "Computer Science");
  await user.type(
    screen.getByLabelText("Explanation", { exact: false }),
    "Supports the same research area.",
  );
}

describe("AddGrantModal", () => {
  it("renders nothing when the modal is closed", () => {
    renderAddGrantModal({ requestOverrides: { showAddGrantModal: false } });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a blank form with every field enabled", async () => {
    renderAddGrantModal();

    await screen.findByRole("dialog");

    expect(screen.getByRole("heading", { name: "Add Supporting Grant" })).toBeInTheDocument();
    for (const label of ["Grant Title", "PI Name"]) {
      const field = screen.getByLabelText(label, { exact: false });
      expect(field).toHaveValue("");
      expect(field).toBeEnabled();
    }
    // Grant Number and Program Officer Name only mount once the pending
    // question is answered as No - see GrantFields.test.tsx.
    expect(screen.queryByLabelText("Grant Number", { exact: false })).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Program Officer Name", { exact: false }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "No" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Add Grant" })).toBeInTheDocument();
  });

  // Regression: Radix's dialog autofocus used to focus and blur every field
  // in turn inside a shadow root (see focusFirstTabbable in dialog.tsx),
  // marking them all touched, so the first change - which runs the form's
  // validation - showed "required" on every field at once.
  it("shows no errors on untouched fields after the first change inside a shadow root", async () => {
    const user = userEvent.setup();
    const shadow = renderAddGrantModalInShadowRoot();
    await shadow.findByRole("dialog");

    await user.click(shadow.getByRole("radio", { name: "Yes" }));

    expect(shadow.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(shadow.queryByText(/This field is required/)).not.toBeInTheDocument();
  });

  // fillOutMinimalGrant types out several fields character-by-character plus
  // two Select interactions; under a full-suite run (many worker processes
  // competing for CPU) that comfortably exceeds vitest's 5000ms default
  // testTimeout even though nothing is actually stuck, so this one gets a
  // longer explicit timeout rather than a flaky failure.
  it(
    "posts a grants[] entry with no grantId, and refetches the projects list on success",
    async () => {
      const user = userEvent.setup();
      let body: any = null;
      server.use(
        http.post(SAVE_URL, async ({ request }) => {
          body = await request.json();
          return new HttpResponse(null, { status: 200 });
        }),
        http.get(`${defaultRoutes.projects_path()}.json`, () => HttpResponse.json({ result: [] })),
      );
      renderAddGrantModal();
      await screen.findByRole("dialog");

      await fillOutMinimalGrant(user);
      await user.click(screen.getByRole("button", { name: "Add Grant" }));

      await waitFor(() => expect(body).not.toBeNull());
      expect(body.requestId).toBe(REQUEST_ID);
      expect(body.grants).toHaveLength(1);
      expect(body.grants[0].grantId).toBeUndefined();
      expect(body.grants[0].title).toBe("A New Grant");
      expect(body.grants[0].piName).toBe("Ada Lovelace");
      expect(body.grants[0].fundingAgencyId).toBe(20);
      expect(body.grants[0].primaryFosTypeId).toBe(5);
      expect(body.grants[0].isPending).toBe(true);
    },
    15000,
  );

  // The exact required-field messages are schema.test.ts's job (it exercises
  // supportingGrantSchema/grantEditFormSchema directly, field by field); this
  // only pins that the form actually blocks an empty submission rather than
  // posting it.
  it("does not submit a blank form", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(SAVE_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderAddGrantModal();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Add Grant" }));

    // Give any (wrongly) in-flight submission a chance to land before
    // asserting the negative.
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(called).toBe(false);
  });

  it("reports a rejected create and keeps the modal open", async () => {
    const user = userEvent.setup();
    server.use(
      http.post(SAVE_URL, () =>
        HttpResponse.json({ errors: ["Grant number has already been taken"] }, { status: 422 }),
      ),
    );
    renderAddGrantModal();
    await screen.findByRole("dialog");

    await fillOutMinimalGrant(user);
    await user.click(screen.getByRole("button", { name: "Add Grant" }));

    expect(
      await screen.findByText("Grant number has already been taken"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Cancel closes the modal without saving", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.post(SAVE_URL, () => {
        called = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderAddGrantModal();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(called).toBe(false);
  });

  // The NSF lock is a UI restriction (GrantFields.tsx), not a server-enforced
  // one, and My Projects always leaves it at its default, which is on. It
  // engages only once NSF's own award database recognises the grant number
  // (GrantFields.tsx's nsfLockingAward), so this serves that lookup - a typo'd
  // number must not lock a brand-new grant, which is the whole reason the
  // trigger isn't "NSF agency plus something in the field".
  it("locks every field but Field of Science and Explanation once NSF confirms the grant number entered here", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(/research\.gov\/awardapi-service/, () =>
        HttpResponse.json({ response: { award: [{ title: "A Study of Studies" }] } }),
      ),
    );
    renderAddGrantModal();
    await screen.findByRole("dialog");

    // Grant Number only mounts once the pending question is answered as No.
    // It also has to already look like a 7-digit NSF number: switching the
    // funding agency to NSF clears anything that doesn't (GrantFields.tsx),
    // which would otherwise wipe the field before the lock ever sees it.
    await user.click(screen.getByRole("radio", { name: "No" }));
    await user.type(
      await screen.findByLabelText("Grant Number", { exact: false }),
      "1234567",
    );
    await selectOption(user, "Funding Agency", "National Science Foundation");

    expect(
      await screen.findByText(/populated from NSF's records/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Grant Title", { exact: false })).toBeDisabled();
  });

  it("does not lock anything for a grant number NSF has no record of", async () => {
    const user = userEvent.setup();
    let lookups = 0;
    server.use(
      http.get(/research\.gov\/awardapi-service/, () => {
        lookups += 1;
        return HttpResponse.json({ response: { award: [] } });
      }),
    );
    renderAddGrantModal();
    await screen.findByRole("dialog");

    await user.click(screen.getByRole("radio", { name: "No" }));
    await user.type(
      await screen.findByLabelText("Grant Number", { exact: false }),
      "0000000",
    );
    await selectOption(user, "Funding Agency", "National Science Foundation");

    await waitFor(() => expect(lookups).toBe(1));
    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Grant Number", { exact: false })).toBeEnabled();
    expect(screen.getByLabelText("Grant Title", { exact: false })).toBeEnabled();
  });

  it("does not lock anything for an NSF funding agency with no grant number yet", async () => {
    const user = userEvent.setup();
    renderAddGrantModal();
    await screen.findByRole("dialog");

    await selectOption(user, "Funding Agency", "National Science Foundation");

    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Grant Title", { exact: false })).toBeEnabled();
  });

  it("does not lock anything for a non-NSF funding agency", async () => {
    const user = userEvent.setup();
    renderAddGrantModal();
    await screen.findByRole("dialog");

    await selectOption(user, "Funding Agency", "Department of Energy");

    expect(screen.queryByText(/populated from NSF's records/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Grant Title", { exact: false })).toBeEnabled();
  });
});
