export interface FundingAgency {
  id: number | string;
  name: string;
  abbr: string;
}

export interface FosType {
  id: number | string;
  name: string;
}

export type GrantFieldName =
  | "fundingAgencyId"
  | "grantNumber"
  | "title"
  | "piName"
  | "beginDate"
  | "endDate"
  | "primaryFosTypeId"
  | "awardedAmount"
  | "programOfficerName"
  | "programOfficerEmail"
  | "comments";

export interface SupportingGrant {
  id?: number | string;
  fundingAgencyId: number | string | null;
  grantNumber: string;
  isPending: boolean | null;
  title: string;
  piName: string;
  beginDate: string;
  endDate: string;
  primaryFosTypeId: number | string | null;
  awardedAmount: string;
  awardedUnits: string;
  programOfficerName: string;
  programOfficerEmail: string;
  comments: string;
  _destroy?: boolean;
}

export interface SupportingGrantsProps {
  target: HTMLElement;
  fundingAgencies: FundingAgency[];
  fosTypes: FosType[];
  initialGrants?: SupportingGrant[];
  initialIncludeSupportingGrants?: boolean | null;
  onSubmit?: (grants: SupportingGrant[]) => void;
}
