import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import { fosTypesAtom, fundingAgenciesAtom } from "@/supporting-grants/atoms";

// src/supporting-grants/atoms.ts is two plain (non-derived, non-fetching)
// jotai atoms. No MSW is needed here - there is no network access in this
// module at all.
//
// It used to hold `fieldsConfigAtom`, `includeSupportingGrantsAtom` and the
// `isFieldHidden` helper as well, each with its own tests here. The
// supporting-grants rework dropped per-field hiding entirely and moved the
// include-supporting-grants answer into the form's own values (see
// `SupportingGrantsState` in ./types), so those tests went with the code they
// were characterizing.
describe("supporting-grants atoms defaults", () => {
  it("initializes with empty defaults on a bare store", () => {
    const store = createStore();

    expect(store.get(fundingAgenciesAtom)).toEqual([]);
    expect(store.get(fosTypesAtom)).toEqual([]);
  });
});
