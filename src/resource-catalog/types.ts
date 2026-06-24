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

export type Resource = {
  resourceName: string;
  resourceId: number;
  resourceType: string;
  organization: string;
  units: string;
  userGuideUrl: string;
  resourceDescription: string;
  description: string;
  recommendedUse: string;
  features: string[];
  featureIds: number[];
  sortCategory: string;
};

export type CatalogParams = {
  apiUrl: string;
  excludedCategories: string[];
  excludedFilters: string[];
  excludedResources: string[];
  allowedCategories: string[];
  allowedFilters: string[];
};

export type ResourceCatalogProps = {
  apiUrl: string;
  excludedCategories?: string[];
  excludedFilters?: string[];
  excludedResources?: string[];
  allowedCategories?: string[];
  allowedFilters?: string[];
};
