import { describe, expect, it } from "vitest";
import { createStore } from "jotai";
import {
  fieldsConfigAtom,
  fosTypesAtom,
  fundingAgenciesAtom,
  includeSupportingGrantsAtom,
  isFieldHidden,
} from "@/supporting-grants/atoms";
import type { FieldsConfig } from "@/supporting-grants/types";

// src/supporting-grants/atoms.ts is 15 lines: four plain (non-derived,
// non-fetching) jotai atoms plus one pure helper. No MSW is needed here -
// there is no network access in this module at all.
describe("supporting-grants atoms defaults", () => {
  it("initializes with empty/neutral defaults on a bare store", () => {
    const store = createStore();

    expect(store.get(fundingAgenciesAtom)).toEqual([]);
    expect(store.get(fosTypesAtom)).toEqual([]);
    expect(store.get(fieldsConfigAtom)).toEqual({});
    expect(store.get(includeSupportingGrantsAtom)).toBeNull();
  });
});

describe("isFieldHidden", () => {
  it("returns true when the field is explicitly hidden", () => {
    const fieldsConfig: FieldsConfig = {
      request: { grants: { grantNumber: { hidden: true } } },
    };

    expect(isFieldHidden(fieldsConfig, "grantNumber")).toBe(true);
  });

  it("returns false when the field is explicitly not hidden", () => {
    const fieldsConfig: FieldsConfig = {
      request: { grants: { grantNumber: { hidden: false } } },
    };

    expect(isFieldHidden(fieldsConfig, "grantNumber")).toBe(false);
  });

  it("falls back to false when the field is present but has no `hidden` key", () => {
    const fieldsConfig: FieldsConfig = {
      request: { grants: { grantNumber: {} } },
    };

    expect(isFieldHidden(fieldsConfig, "grantNumber")).toBe(false);
  });

  it("falls back to false when the field itself is absent from grants", () => {
    const fieldsConfig: FieldsConfig = {
      request: { grants: { title: { hidden: true } } },
    };

    expect(isFieldHidden(fieldsConfig, "grantNumber")).toBe(false);
  });

  it("does not throw when `fieldsConfig.request` is absent entirely", () => {
    const fieldsConfig: FieldsConfig = {};

    expect(() => isFieldHidden(fieldsConfig, "grantNumber")).not.toThrow();
    expect(isFieldHidden(fieldsConfig, "grantNumber")).toBe(false);
  });
});
