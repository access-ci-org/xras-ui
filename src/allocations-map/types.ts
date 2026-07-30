import type { OrganizationType } from "./config";

export type GeoFeature<P = Record<string, unknown>> = {
  type: string;
  id?: string | number;
  geometry: { type: string; coordinates: any };
  properties: P;
};

export type FeatureCollection<P = Record<string, unknown>> = {
  type: "FeatureCollection";
  features: GeoFeature<P>[];
};

export type OrgProperties = {
  name: string;
  abbr: string;
  userCredits: number;
  userCreditsMap: Record<string, number>;
  rpCredits: number;
  rpCreditsMap: Record<string, number>;
};

export type OrgFeature = GeoFeature<OrgProperties>;

export type CreditRow = {
  user_organization_id: string | number;
  rp_organization_id: string | number;
  credits: number;
  [key: string]: unknown;
};

export type CreditsResponse = { result: CreditRow[] };

export type CreditsGeoJSON = {
  creditLines: FeatureCollection<CreditRow>;
  userPoints: FeatureCollection<OrgProperties>;
  rpPoints: FeatureCollection<OrgProperties>;
};

export type CreditLevel = [string, number];

export type CreditLevels = {
  lines: CreditLevel[];
  points: CreditLevel[];
};

// The hovered/clicked map feature, as reported by maplibre-gl's mousemove event.
export type ActiveOrg = GeoFeature<Record<string, string>> & { id: string | number };

export type CreditType = "allocated" | "exchanged" | "used";

export type MapStyleOptions = {
  activeOrg: ActiveOrg | null;
  basemapStyle: Record<string, any> | null;
  creditLevels: CreditLevels | null;
  creditType: CreditType;
  geoJSON: CreditsGeoJSON | null;
  organizationType: OrganizationType;
};
