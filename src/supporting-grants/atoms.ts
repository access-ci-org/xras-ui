import { atom } from "jotai";

import type { FieldsConfig, FosType, FundingAgency } from "./types";

export const fundingAgenciesAtom = atom<FundingAgency[]>([]);
export const fosTypesAtom = atom<FosType[]>([]);
export const fieldsConfigAtom = atom<FieldsConfig>({});
export const includeSupportingGrantsAtom = atom<boolean | null>(null);

export function isFieldHidden(
  fieldsConfig: FieldsConfig,
  field: keyof NonNullable<NonNullable<FieldsConfig["request"]>["grants"]>,
) {
  return fieldsConfig.request?.grants?.[field]?.hidden ?? false;
}
