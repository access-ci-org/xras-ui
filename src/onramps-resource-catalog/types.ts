export type Feature = {
  featureId: number;
  name: string;
  categoryId: number;
};

export type FilterCategoryType = {
  categoryId: number;
  categoryName: string;
  categoryDescription: string;
  features: Feature[];
};

export type RelatedResource = {
  cider_resource_id: number;
  displayResourceName: string;
};

/*
 * The shape `transformRampsData` produces. The index signature is load-bearing:
 * `formatResourceFeatures` spreads the raw API resource in, so a resource
 * carries every field the feed happened to have alongside the named ones.
 */
export type Resource = {
  resourceId: number;
  resourceName: string;
  displayResourceName?: string;
  recommendedUse?: string;
  resourceCategory?: string;
  icon?: string | null;
  features: string[];
  filters?: number[];
  relatedResources?: RelatedResource[];
  groupId?: number;
  [key: string]: unknown;
};

/** The allow/exclude configuration `mergeData` applies to one feed. */
export type CatalogSource = {
  allowedCategories: string[];
  allowedFilters: string[];
  allowedResources?: string[];
  excludedCategories: string[];
  excludedFilters: string[];
  excludedResources: string[];
};

export type ResourceCatalogProps = {
  onRamps?: boolean;
  baseUrl?: string;
};
