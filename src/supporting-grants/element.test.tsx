// jsdom exposes `attachInternals` on HTMLElement.prototype but the object it
// returns has neither setFormValue nor setValidity, so form association is
// only half-present. element.tsx's own feature detect keys off the presence
// of `attachInternals` and therefore never loads the polyfill here; importing
// it explicitly (before anything that defines an element) gives the tests a
// working ElementInternals. In a real browser the two ship together, so this
// gap is a jsdom artefact rather than a production one.
import "element-internals-polyfill";

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SupportingGrantsElement,
  defineSupportingGrantsElement,
} from "./element";
import type { SupportingGrantAttributes } from "./types";

const AGENCIES = [{ id: 1, name: "National Science Foundation", abbr: "NSF" }];
const FOS_TYPES = [{ id: 12, name: "Computer Science" }];

function attributes(
  overrides: Partial<SupportingGrantAttributes> = {},
): SupportingGrantAttributes {
  return {
    id: 7,
    funding_agency_id: 1,
    grant_number: "1234567",
    is_pending: false,
    title: "A Study of Studies",
    pi_name: "Ada Lovelace",
    begin_date: "2024-03-01",
    end_date: "2027-02-28",
    primary_fos_type_id: 12,
    awarded_amount: "500000",
    awarded_units: "Dollars",
    program_officer_name: "Grace Hopper",
    program_officer_email: "ghopper@nsf.gov",
    comments: "Related work",
    ...overrides,
  };
}

// The whole file shares one registration. A constructor can be registered
// under only one name per document ("this constructor has already been
// registered in the registry"), and the registry outlives each test, so
// per-test tag names are not an option.
const TAG = "supporting-grants-field";

beforeAll(() => defineSupportingGrantsElement());

const forms: HTMLFormElement[] = [];

afterEach(() => {
  // Disconnecting runs disconnectedCallback, which unmounts the React root;
  // leaving mounted roots behind leaks their effects into later tests.
  for (const form of forms.splice(0)) form.remove();
});

/**
 * Registers the element under a fresh tag name, sets the data properties
 * (which must be assigned before insertion - connectedCallback reads them
 * once), and appends it to a form in the document.
 */
async function mountInForm({
  initialGrants,
  initialIncludeSupportingGrants = null,
  name,
  includeGrantsFieldName,
  stylesheets = [],
  baseUrl,
}: {
  initialGrants?: SupportingGrantAttributes[];
  initialIncludeSupportingGrants?: boolean | null;
  name?: string;
  includeGrantsFieldName?: string;
  stylesheets?: string[] | null;
  baseUrl?: string;
} = {}) {
  const form = document.createElement("form");
  document.body.appendChild(form);
  forms.push(form);

  const el = document.createElement(TAG) as SupportingGrantsElement;
  el.fundingAgencies = AGENCIES;
  el.fosTypes = FOS_TYPES;
  el.initialGrants = initialGrants;
  el.initialIncludeSupportingGrants = initialIncludeSupportingGrants;
  el.stylesheets = stylesheets;
  if (baseUrl !== undefined) el.baseUrl = baseUrl;
  if (name !== undefined) el.setAttribute("name", name);
  if (includeGrantsFieldName !== undefined) {
    el.setAttribute("include-grants-field-name", includeGrantsFieldName);
  }

  await act(async () => {
    form.appendChild(el);
  });

  const shadow = within(el.shadowRoot as unknown as HTMLElement);
  await shadow.findByText("Does this request include supporting grants?");

  return { el, form, shadow };
}

function entries(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries(
    [...new FormData(form).entries()].map(([key, value]) => [key, String(value)]),
  );
}

describe("defineSupportingGrantsElement", () => {
  it("registers <supporting-grants-field> by default", () => {
    // The default tag name is the public contract: consuming Rails views put
    // this literal element in their markup.
    expect(customElements.get(TAG)).toBe(SupportingGrantsElement);
  });

  it("is safe to call more than once", async () => {
    // A page that loads the bundle twice, or calls this from two widgets,
    // would otherwise throw NotSupportedError on the second registration.
    await expect(defineSupportingGrantsElement()).resolves.toBeUndefined();
  });
});

describe("SupportingGrantsElement", () => {
  it("renders the section into its own shadow root, not the light DOM", async () => {
    const { el, shadow } = await mountInForm();

    expect(shadow.getByText("Does this request include supporting grants?")).toBeInTheDocument();
    // The light DOM stays empty - that's the whole reason the element needs
    // to be form-associated to participate in submission.
    expect(el.children).toHaveLength(0);
  });

  it("renders the grants it was given before insertion", async () => {
    const { el } = await mountInForm({
      initialGrants: [attributes()],
      initialIncludeSupportingGrants: true,
    });

    const grantNumber = el.shadowRoot!.getElementById(
      "grants[0].grantNumber",
    ) as HTMLInputElement;
    expect(grantNumber).toHaveValue("1234567");
  });

  it("tears the React tree down when it leaves the document", async () => {
    const { el, shadow } = await mountInForm();

    await act(async () => {
      el.remove();
    });

    expect(shadow.queryByText("Does this request include supporting grants?")).toBeNull();
  });

  describe("the value it contributes to the surrounding form", () => {
    it("submits its grants under the default name", async () => {
      const { form } = await mountInForm({
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      await waitFor(() =>
        expect(entries(form)["supporting_grants[0][grant_number]"]).toBe("1234567"),
      );
      expect(entries(form)["supporting_grants[0][id]"]).toBe("7");
      // Serialized for Rails, not for display.
      expect(entries(form)["supporting_grants[0][awarded_amount]"]).toBe("500000");
    });

    it("uses the name attribute when one is set", async () => {
      const { form } = await mountInForm({
        name: "request[supporting_grants]",
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      await waitFor(() =>
        expect(entries(form)["request[supporting_grants][0][grant_number]"]).toBe("1234567"),
      );
    });

    it("submits the include-grants answer only when a field name is configured", async () => {
      const withField = await mountInForm({
        includeGrantsFieldName: "request[has_grants]",
        initialIncludeSupportingGrants: false,
      });
      await waitFor(() =>
        expect(entries(withField.form)["request[has_grants]"]).toBe("false"),
      );

      const withoutField = await mountInForm({ initialIncludeSupportingGrants: false });
      expect(entries(withoutField.form)).toEqual({});
    });

    it("keeps the submitted value up to date as the user edits", async () => {
      const user = userEvent.setup();
      const { el, form } = await mountInForm({
        includeGrantsFieldName: "request[has_grants]",
      });

      const no = el.shadowRoot!.getElementById("includeSupportingGrants-false")!;
      await user.click(no);

      await waitFor(() => expect(entries(form)["request[has_grants]"]).toBe("false"));
    });
  });

  describe("constraint validation", () => {
    it("blocks the surrounding form while the section is incomplete", async () => {
      const { form } = await mountInForm();

      await waitFor(() => expect(form.checkValidity()).toBe(false));
    });

    it("releases the form once the section is complete", async () => {
      const { form } = await mountInForm({
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });

      await waitFor(() => expect(form.checkValidity()).toBe(true));
    });

    it("releases a form it had already blocked once the user completes the section", async () => {
      // The transition is what matters, and it is not the same test as the
      // one above: a section that is valid on mount never sets a custom
      // error, so it would pass even if the clearing branch did nothing.
      const user = userEvent.setup();
      const { el, form } = await mountInForm({ initialGrants: [attributes()] });
      await waitFor(() => expect(form.checkValidity()).toBe(false));

      await user.click(el.shadowRoot!.getElementById("includeSupportingGrants-true")!);

      await waitFor(() => expect(form.checkValidity()).toBe(true));
    });

    it("blocks the form again when a required field is emptied", async () => {
      const { el, form } = await mountInForm({
        initialGrants: [attributes()],
        initialIncludeSupportingGrants: true,
      });
      await waitFor(() => expect(form.checkValidity()).toBe(true));

      const title = el.shadowRoot!.getElementById("grants[0].title") as HTMLInputElement;
      // fireEvent rather than user-event: clearing a field requires focusing
      // it first, and user-event cannot focus through a shadow root that has
      // delegatesFocus set.
      fireEvent.change(title, { target: { value: "" } });

      await waitFor(() => expect(form.checkValidity()).toBe(false));
    });

    it("recovers focus itself when the browser fires invalid without focusing", async () => {
      // Firefox blocks the submit but never focuses or reports a
      // form-associated custom element, so the user sees nothing at all. The
      // deferred handler on `invalid` is what puts focus back in the shadow
      // tree; the setTimeout is so browsers that do handle this keep their
      // own native bubble.
      const { el } = await mountInForm();
      const focus = vi.spyOn(el, "focus");

      vi.useFakeTimers();
      try {
        el.dispatchEvent(new Event("invalid"));
        // Deferred, so a browser that focuses and reports natively gets to go
        // first and keep its own validation bubble.
        expect(focus).not.toHaveBeenCalled();

        vi.runAllTimers();
        expect(focus).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("shadow stylesheets", () => {
    it("links the stylesheets it was given, resolved against baseUrl", async () => {
      const { el } = await mountInForm({
        baseUrl: "https://cdn.example.org/xras-ui",
        stylesheets: ["tailwind.css"],
      });

      const hrefs = [...el.shadowRoot!.querySelectorAll("link")].map((link) => link.href);
      expect(hrefs).toEqual(["https://cdn.example.org/xras-ui/tailwind.css"]);
    });

    it("passes absolute and root-relative hrefs through untouched", async () => {
      const { el } = await mountInForm({
        baseUrl: "https://cdn.example.org/xras-ui",
        stylesheets: ["https://example.com/a.css", "/assets/b.css"],
      });

      const hrefs = [...el.shadowRoot!.querySelectorAll("link")].map((link) =>
        link.getAttribute("href"),
      );
      expect(hrefs).toEqual(["https://example.com/a.css", "/assets/b.css"]);
    });

    it("links a default stylesheet when none is configured", async () => {
      // Shadow DOM inherits nothing from the page, so the built tailwind.css
      // has to be linked inside the element or it renders unstyled.
      const { el } = await mountInForm({ stylesheets: null });

      const hrefs = [...el.shadowRoot!.querySelectorAll("link")].map((link) => link.href);
      expect(hrefs).toHaveLength(1);
      expect(hrefs[0]).toMatch(/tailwind\.css/);
    });

    it("does not link them again when the element is moved in the document", async () => {
      // connectedCallback runs on every insertion, so without the guard an
      // element that is relocated accumulates a duplicate <link> each time.
      const { el, form } = await mountInForm({
        baseUrl: "https://cdn.example.org/xras-ui",
        stylesheets: ["tailwind.css"],
      });

      await act(async () => {
        el.remove();
        form.appendChild(el);
      });

      expect(el.shadowRoot!.querySelectorAll("link")).toHaveLength(1);
    });

    it("links them once, ahead of the React container", async () => {
      const { el } = await mountInForm({
        baseUrl: "https://cdn.example.org/xras-ui",
        stylesheets: ["tailwind.css"],
      });

      expect(el.shadowRoot!.firstElementChild!.tagName).toBe("LINK");
      expect(el.shadowRoot!.querySelectorAll("link")).toHaveLength(1);
    });
  });

  describe("the name and include-grants-field-name properties", () => {
    it("default the name and leave the include field unset", async () => {
      const { el } = await mountInForm();

      expect(el.name).toBe("supporting_grants");
      expect(el.includeGrantsFieldName).toBeNull();
    });

    it("reflect their attributes in both directions", async () => {
      const { el } = await mountInForm();

      el.name = "request[grants]";
      expect(el.getAttribute("name")).toBe("request[grants]");

      el.includeGrantsFieldName = "request[has_grants]";
      expect(el.getAttribute("include-grants-field-name")).toBe("request[has_grants]");

      el.includeGrantsFieldName = null;
      expect(el.hasAttribute("include-grants-field-name")).toBe(false);
    });
  });
});
