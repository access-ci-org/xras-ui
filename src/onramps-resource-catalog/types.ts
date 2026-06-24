export type Feature = {
  featureId: number;
  name: string;
  description: string;
  categoryId: number;
  selected: boolean;
};

export type FilterCategoryType = {
  categoryId: number;
  categoryName: string;
  categoryDescription: string;
  features: Feature[];
};

export type RelatedResource = {
  info_resourceid: number;
  cider_resource_id: number;
  resourceName: string;
  displayResourceName: string;
};

export type Resource = {
  resourceId: number;
  resourceName: string;
  displayResourceName?: string;
  resourceDescription?: string;
  recommendedUse?: string;
  resourceType?: string;
  resourceCategory?: string;
  organization?: string;
  icon?: string | null;
  logo?: string | null;
  features: string[];
  featureIds: number[];
  filters?: number[];
  relatedResources?: RelatedResource[];
  groupId?: number;
  sortCategory: string;
  [key: string]: unknown;
};

export type Catalog = {
  catalogLabel: string;
  catalogId: string;
  selected: boolean;
  resourceIds: number[];
  description?: string;
  [key: string]: unknown;
};

export type CatalogSource = {
  apiUrl: string;
  catalogLabel: string;
  allowedCategories: string[];
  allowedFilters: string[];
  allowedResources?: string[];
  excludedCategories: string[];
  excludedFilters: string[];
  excludedResources: string[];
};

export type ResourceCatalogProps = {
  catalogSources?: CatalogSource[];
  onRamps?: boolean;
  baseUrl?: string;
  onRampsApi?: string;
};
