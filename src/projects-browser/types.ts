export type FosType = {
  fosTypeId: number;
  fosName: string;
};

export type TypeLists = {
  orgs: string[];
  fosTypes: FosType[];
  allocationTypes: string[];
  resources: { resourceId: number; resourceName: string }[];
};

export type Filters = {
  org: string;
  allocationType: string;
  fosTypeIds: number[];
  resource: string;
  requestNumber: string;
};

export type PageData = {
  current_page: number;
  last_page: number;
};

export type Resource = {
  resourceName?: string;
  resourceUnits?: string;
  units?: string;
  allocation?: string;
  amount?: string;
};

export type Publication = {
  authors: { last_name: string; first_name: string }[];
  projects: { grant_number: string }[];
  publication_type: string;
  publication_year: string | null;
  doi: string | null;
  journal: { title: string | null };
  publication_datas: Record<string, string> | null;
  title: string;
};

export type CoPi = {
  name: string;
  organization: string;
};

export type Project = {
  projectId: number;
  requestId: number;
  requestNumber: string;
  requestTitle: string;
  allocationType: string;
  abstract: string;
  pi: string;
  piInstitution: string;
  coPis: CoPi[];
  fos: string;
  beginDate: string;
  endDate: string;
  resources: Resource[];
  publications: Publication[];
};
