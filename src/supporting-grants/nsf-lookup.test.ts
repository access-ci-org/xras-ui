import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw";
import { fetchNSFGrantDetails, nsfDateToIso } from "./nsf-lookup";

const AWARD_API = /research\.gov\/awardapi-service/;

function award(overrides: Record<string, unknown> = {}) {
  return {
    id: "1234567",
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

describe("fetchNSFGrantDetails", () => {
  it("returns the first award from the research.gov envelope", async () => {
    server.use(
      http.get(AWARD_API, () =>
        HttpResponse.json({ response: { award: [award(), award({ id: "9999999" })] } }),
      ),
    );

    const details = await fetchNSFGrantDetails("1234567");

    expect(details).toMatchObject({ id: "1234567", pdPIName: "Ada Lovelace" });
  });

  it("requests the award number's own endpoint and asks for the fields the form fills in", async () => {
    let requested: URL | null = null;
    server.use(
      http.get(AWARD_API, ({ request }) => {
        requested = new URL(request.url);
        return HttpResponse.json({ response: { award: [award()] } });
      }),
    );

    await fetchNSFGrantDetails("1234567");

    expect(requested!.pathname).toBe("/awardapi-service/v1/awards/1234567.json");
    // Every field GrantFields' setIfEmpty calls reference has to be in
    // printFields, or the API returns the award without it and the lookup
    // silently fills in nothing.
    const printFields = requested!.searchParams.get("printFields")!.split(",");
    expect(printFields).toEqual(
      expect.arrayContaining([
        "title",
        "poName",
        "poEmail",
        "pdPIName",
        "startDate",
        "expDate",
        "fundsObligatedAmt",
      ]),
    );
  });

  it("returns null when the award list is empty", async () => {
    server.use(http.get(AWARD_API, () => HttpResponse.json({ response: { award: [] } })));

    expect(await fetchNSFGrantDetails("1234567")).toBeNull();
  });

  it("returns null when the envelope has no response at all", async () => {
    // research.gov answers 200 with a body shaped differently for an unknown
    // award number, so the optional chain is the real miss path, not the 404.
    server.use(http.get(AWARD_API, () => HttpResponse.json({})));

    expect(await fetchNSFGrantDetails("0000000")).toBeNull();
  });

  it("returns null on a non-200 response without reading the body", async () => {
    server.use(
      http.get(AWARD_API, () => new HttpResponse("<html>gateway timeout</html>", { status: 504 })),
    );

    // The body isn't JSON; returning null before res.json() is what keeps
    // this from throwing a parse error instead.
    await expect(fetchNSFGrantDetails("1234567")).resolves.toBeNull();
  });
});

describe("nsfDateToIso", () => {
  it("converts the API's MM/DD/YYYY into the YYYY-MM-DD the form uses", () => {
    expect(nsfDateToIso("03/01/2024")).toBe("2024-03-01");
  });

  it("leaves a value that is already ISO alone", () => {
    expect(nsfDateToIso("2024-03-01")).toBe("2024-03-01");
  });

  it("returns the input unchanged when there is no trailing year to move", () => {
    expect(nsfDateToIso("")).toBe("");
  });
});
