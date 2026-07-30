import type { ReactNode } from "react";

export type PublicationAuthor = {
  portal_username?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  prefix?: string;
  suffix?: string;
  initials?: string;
  affiliation?: string;
  hash?: Record<string, unknown>;
};

export type PublicationField = {
  csl_field_name: string;
  name: string;
  field_value?: string;
};

export type PublicationTypeOption = {
  type_id?: number | string;
  publication_type: string;
  citation_style_type?: string;
  fields: PublicationField[];
};

export type ProjectResourceOption = {
  resource_id: number | string;
  label?: string;
  value?: string;
  resource_name?: string;
  organization_abbrev?: string;
  organization_name?: string;
};

export type EditableProject = {
  grant_number: string;
  title: string;
  selected: boolean;
  resources?: ProjectResourceOption[];
};

export type TagOption = { value: string | number; label: string };
export type TagCategory = { label: string; options: TagOption[] };

// The shape returned by `edit_publication_path`/`publication_path("new.json")`
// and mutated locally while a publication is being edited.
export type EditablePublication = {
  publication_id?: number | string;
  publication_type: string;
  publication_year?: string | number | null;
  publication_month?: string | number | null;
  title: string;
  doi?: string;
  authors: PublicationAuthor[];
  fields: PublicationField[];
  access_staff_publication?: boolean;
  tags?: TagCategory[];
  [key: string]: unknown;
};

export type FormError = { id: string; message: ReactNode };

// The lighter-weight shape returned by `search_publications_path`, used for
// browse/list views (distinct from EditablePublication's array-based `fields`).
export type PublicationSummary = {
  publication_id: number | string;
  publication_type: string;
  publication_year: string | number | null;
  title: string;
  doi: string | null;
  authors: { first_name: string; last_name: string }[];
  fields: Record<string, string | undefined>;
  projects: { grant_number: string }[];
  resources: string[];
  created_by?: string;
  can_edit?: boolean;
};

export type FilterSelections = {
  createdBy: string[];
  doi: string;
  grantNumber: string;
  journal: string;
  authorName: string;
  publicationType: string;
};

export type FilterOptions = {
  journals: string[];
  publication_types: string[];
};

export type PageInfo = { current: number; last: number };
