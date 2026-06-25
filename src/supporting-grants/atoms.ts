import { atom } from "jotai";

import type { FosType, FundingAgency } from "./types";

export const fundingAgenciesAtom = atom<FundingAgency[]>([]);
export const fosTypesAtom = atom<FosType[]>([]);
export const includeSupportingGrantsAtom = atom<boolean | null>(null);
