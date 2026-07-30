export type RequiredResource = {
  resource_name: string;
  required_resource_id: number;
};

export type AllocationType = {
  allocation_type_id: number;
  display_name: string;
  allowed_action?: { resource_state_type_id: number | string };
  comment?: string;
  required_resources?: RequiredResource[];
};

export type DiscountRate = {
  id: number;
  exchange_rate: number | string;
  begin_date?: string;
  end_date?: string;
  is_new?: boolean;
  start_date_error?: string;
  end_date_error?: string;
  rate_error?: string;
};

export type ExchangeRates = {
  base_rate: number | string;
  discount_rates?: DiscountRate[];
};

export type ResourceDetails = {
  resource_name: string;
  resource_repository_key?: string;
  description: string;
  resource_type_id: number | string;
  unit_type_id: number | string;
  unit_type?: string;
  min_exchange: number | string;
  dollar_value: number | string;
  allocation_types: AllocationType[];
  exchange_rates?: ExchangeRates;
};

export type ResourceStateTypeAvailable = {
  resource_state_type_id: number | string;
  display_resource_state_type: string;
  action_types: { display_action_type: string }[];
};

export type ResourceTypeAvailable = {
  resource_type_id: number | string;
  display_resource_type: string;
};

export type UnitTypeAvailable = {
  unit_type_id: number | string;
  display_unit_type: string;
};

export type RequiredResourceAvailable = {
  resource_id: number;
  resource_name: string;
};

export type UnassignedAllocationType = {
  allocation_type_id: number;
  display_name: string;
};

export type ResourceData = {
  resource_details: ResourceDetails;
  uses_exchange_rates?: boolean;
  resource_state_types_available?: ResourceStateTypeAvailable[];
  resource_types_available?: ResourceTypeAvailable[];
  unit_types_available?: UnitTypeAvailable[];
  required_resources_available?: RequiredResourceAvailable[];
  unassigned_allocation_types?: UnassignedAllocationType[];
};

export type SuccessMessage = { message: string; color: string };

export type ResourceState = {
  resourceData: ResourceData | null;
  loading: boolean;
  errors: string[];
  successMessage: SuccessMessage;
};

export type ResourceAction =
  | { type: "SET_RESOURCE_DATA"; payload: ResourceData }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SUCCESS_MESSAGE"; payload: SuccessMessage }
  | { type: "SET_ERRORS"; payload: string | string[] }
  | { type: "UPDATE_RESOURCE_FIELD"; field: string; value: unknown }
  | {
      type: "UPDATE_ALLOCATION";
      payload: { allocationTypeId: number; updates: Partial<AllocationType> };
    }
  | { type: "UPDATE_BASE_RATE"; payload: number | string }
  | {
      type: "UPDATE_EXCHANGE_RATE";
      payload: { rateId: number; changes: Partial<DiscountRate> };
    }
  | { type: "ADD_EXCHANGE_RATE"; payload: DiscountRate }
  | { type: "DELETE_EXCHANGE_RATE"; payload: number };

export type Option = { value: string | number; label: string };
