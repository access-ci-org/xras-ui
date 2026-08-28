import { atom } from "jotai";
import type {
  AllocationType,
  DiscountRate,
  Option,
  ResourceData,
  SuccessMessage,
} from "./types";
import { fetchResourceData, updateResourceData } from "./helpers/utils";
import { collectDateErrors, validateRateDates } from "./helpers/exchangeRates";

const MAX_DATE = "2100-12-31";

export const resourceIdAtom = atom(0);
export const relativeUrlRootAtom = atom("");

export const resourceDataAtom = atom<ResourceData | null>(null);
export const loadingAtom = atom(true);
export const errorsAtom = atom<string[]>([]);
export const successMessageAtom = atom<SuccessMessage>({ message: "", color: "" });

export const resourceDetailsAtom = atom(
  (get) => get(resourceDataAtom)?.resource_details ?? null,
);
export const usesExchangeRatesAtom = atom(
  (get) => get(resourceDataAtom)?.uses_exchange_rates ?? false,
);

export const allowedActionsOptionsAtom = atom((get) =>
  (get(resourceDataAtom)?.resource_state_types_available ?? []).map((state) => ({
    value: state.resource_state_type_id,
    label: state.display_resource_state_type,
    additionalInfo: state.action_types.map((action) => action.display_action_type).join(", "),
  })),
);

export const resourceTypesOptionsAtom = atom<Option[]>((get) =>
  (get(resourceDataAtom)?.resource_types_available ?? []).map((type) => ({
    value: type.resource_type_id,
    label: type.display_resource_type,
  })),
);

export const unitTypesOptionsAtom = atom<Option[]>((get) =>
  (get(resourceDataAtom)?.unit_types_available ?? []).map((type) => ({
    value: type.unit_type_id,
    label: type.display_unit_type,
  })),
);

export const availableResourcesAtom = atom(
  (get) => get(resourceDataAtom)?.required_resources_available ?? [],
);

export const availableAllocationTypesAtom = atom(
  (get) => get(resourceDataAtom)?.unassigned_allocation_types ?? [],
);

export const requiredResourceNamesAtom = atom((get) => {
  const names = new Set<string>();
  get(resourceDetailsAtom)?.allocation_types?.forEach((type) => {
    type.required_resources?.forEach((resource) => names.add(resource.resource_name));
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
});

export const dateErrorsAtom = atom((get) =>
  collectDateErrors(get(resourceDetailsAtom)?.exchange_rates?.discount_rates ?? []),
);

// UI-only state
export const isAllocationEditingAtom = atom(false);
export const showAddResourceModalAtom = atom(false);
export const showAddAllocationTypeModalAtom = atom(false);

function updateResourceDetails(
  data: ResourceData,
  updates: Partial<ResourceData["resource_details"]>,
): ResourceData {
  return { ...data, resource_details: { ...data.resource_details, ...updates } };
}

function updateAllocationTypes(
  data: ResourceData,
  updates: (types: AllocationType[]) => AllocationType[],
): ResourceData {
  return updateResourceDetails(data, {
    allocation_types: updates(data.resource_details.allocation_types),
  });
}

function updateExchangeRates(
  data: ResourceData,
  updates: (rates: NonNullable<ResourceData["resource_details"]["exchange_rates"]>) => Partial<
    NonNullable<ResourceData["resource_details"]["exchange_rates"]>
  >,
): ResourceData {
  const exchangeRates = data.resource_details.exchange_rates;
  if (!exchangeRates) return data;
  return updateResourceDetails(data, {
    exchange_rates: { ...exchangeRates, ...updates(exchangeRates) },
  });
}

export const fetchResourceDataAtom = atom(null, async (get, set) => {
  set(loadingAtom, true);
  try {
    const data = await fetchResourceData(get(resourceIdAtom), get(relativeUrlRootAtom));
    set(resourceDataAtom, data);
  } catch (error) {
    console.error("Failed to fetch resource data:", error);
    set(errorsAtom, ["Failed to fetch resource data. Please try again later."]);
  } finally {
    set(loadingAtom, false);
  }
});

async function errorsFromResponse(response: Response, defaultMessage: string) {
  try {
    const errorData = await response.json();
    if (errorData.errors) return errorData.errors as string[];
    if (errorData.message) return [errorData.message as string];
  } catch (parseError) {
    console.error("Error parsing error response:", parseError);
  }
  return [defaultMessage];
}

export const updateResourceFieldAtom = atom(
  null,
  (get, set, { field, value }: { field: string; value: unknown }) => {
    const data = get(resourceDataAtom);
    if (!data) return;
    set(resourceDataAtom, updateResourceDetails(data, { [field]: value }));
  },
);

export const updateAllocationAtom = atom(
  null,
  (
    get,
    set,
    { allocationTypeId, updates }: { allocationTypeId: number; updates: Partial<AllocationType> },
  ) => {
    const data = get(resourceDataAtom);
    if (!data) return;
    set(
      resourceDataAtom,
      updateAllocationTypes(data, (types) =>
        types.map((type) =>
          type.allocation_type_id === allocationTypeId ? { ...type, ...updates } : type,
        ),
      ),
    );
  },
);

export const changeAllowedActionAtom = atom(
  null,
  (_get, set, { allocationTypeId, resourceStateTypeId }: {
    allocationTypeId: number;
    resourceStateTypeId: string | number;
  }) => {
    set(updateAllocationAtom, {
      allocationTypeId,
      updates: { allowed_action: { resource_state_type_id: resourceStateTypeId } },
    });
  },
);

export const changeCommentAtom = atom(
  null,
  (_get, set, { allocationTypeId, comment }: { allocationTypeId: number; comment: string }) => {
    set(updateAllocationAtom, { allocationTypeId, updates: { comment } });
  },
);

export const changeRequiredResourceAtom = atom(
  null,
  (
    get,
    set,
    { allocationTypeId, resourceName, checked }: {
      allocationTypeId: number;
      resourceName: string;
      checked: boolean;
    },
  ) => {
    const data = get(resourceDataAtom);
    const type = data?.resource_details.allocation_types.find(
      (t) => t.allocation_type_id === allocationTypeId,
    );
    if (!data || !type) return;

    const requiredResources = type.required_resources ?? [];
    const updatedRequiredResources = checked
      ? [
          ...requiredResources,
          {
            resource_name: resourceName,
            required_resource_id: data.required_resources_available!.find(
              (r) => r.resource_name === resourceName,
            )!.resource_id,
          },
        ]
      : requiredResources.filter((resource) => resource.resource_name !== resourceName);

    set(updateAllocationAtom, {
      allocationTypeId,
      updates: { required_resources: updatedRequiredResources },
    });
  },
);

export const saveRequiredResourcesAtom = atom(null, (get, set, selectedResourceIds: number[]) => {
  const data = get(resourceDataAtom);
  const availableResources = get(availableResourcesAtom);
  if (!data) return false;

  const initialRequiredResources = data.resource_details.allocation_types
    .flatMap((type) => type.required_resources ?? [])
    .map((resource) => resource.required_resource_id);

  const addedResources = selectedResourceIds.filter(
    (id) => !initialRequiredResources.includes(id),
  );
  const removedResources = initialRequiredResources.filter(
    (id) => !selectedResourceIds.includes(id),
  );

  set(
    resourceDataAtom,
    updateAllocationTypes(data, (types) =>
      types.map((type) => {
        const currentRequiredResources = type.required_resources ?? [];

        const newResourcesToAdd = addedResources.map((resourceId) => {
          const resource = availableResources.find((r) => r.resource_id === resourceId)!;
          return {
            resource_name: resource.resource_name,
            required_resource_id: resource.resource_id,
          };
        });

        const updatedRequiredResources = currentRequiredResources
          .filter((resource) => !removedResources.includes(resource.required_resource_id))
          .concat(
            newResourcesToAdd.filter(
              (newRes) =>
                !currentRequiredResources.some(
                  (curRes) => curRes.required_resource_id === newRes.required_resource_id,
                ),
            ),
          );

        return { ...type, required_resources: updatedRequiredResources };
      }),
    ),
  );

  return true;
});

export const saveAllocationTypeAtom = atom(null, (get, set, allocationTypeId: string) => {
  const data = get(resourceDataAtom);
  const availableAllocationTypes = get(availableAllocationTypesAtom);
  const allowedActionsOptions = get(allowedActionsOptionsAtom);
  if (!data || !allocationTypeId) return false;

  const newAllocationType = availableAllocationTypes.find(
    (at) => at.allocation_type_id.toString() === allocationTypeId,
  );
  const isExisting = data.resource_details.allocation_types.some(
    (type) => type.allocation_type_id === newAllocationType?.allocation_type_id,
  );
  if (!newAllocationType || isExisting) return false;

  set(
    resourceDataAtom,
    updateAllocationTypes(data, (types) => [
      ...types,
      {
        allocation_type_id: newAllocationType.allocation_type_id,
        display_name: newAllocationType.display_name,
        allowed_action: { resource_state_type_id: allowedActionsOptions[0]?.value ?? "" },
        comment: "",
        required_resources: [],
      },
    ]),
  );

  return true;
});

export const updateBaseRateAtom = atom(null, (get, set, rate: string) => {
  const data = get(resourceDataAtom);
  if (!data) return;
  set(
    resourceDataAtom,
    updateExchangeRates(data, () => ({ base_rate: rate })),
  );
});

function patchDiscountRate(
  data: ResourceData,
  rateId: number,
  changes: Partial<DiscountRate>,
): ResourceData {
  return updateExchangeRates(data, (rates) => ({
    discount_rates: rates.discount_rates?.map((rate) =>
      rate.id === rateId ? { ...rate, ...changes } : rate,
    ),
  }));
}

export const updateRateValueAtom = atom(
  null,
  (get, set, { rateId, value }: { rateId: number; value: string }) => {
    const data = get(resourceDataAtom);
    if (!data) return;
    set(
      resourceDataAtom,
      patchDiscountRate(data, rateId, {
        exchange_rate: value,
        rate_error: value ? "" : "Exchange Rate cannot be empty",
      }),
    );
  },
);

export const updateRateDateAtom = atom(
  null,
  (
    get,
    set,
    { rateId, dateField, value }: {
      rateId: number;
      dateField: "start_date" | "end_date";
      value: string;
    },
  ) => {
    const data = get(resourceDataAtom);
    const discountRates = data?.resource_details.exchange_rates?.discount_rates ?? [];
    const rate = discountRates.find((r) => r.id === rateId);
    if (!data || !rate) return;

    const changes: Partial<DiscountRate> =
      dateField === "end_date" ? { end_date: value } : { begin_date: value };

    // Validate the rate the edit would produce, not just the field that moved,
    // and write the errors `validateRateDates` returns for both fields. It
    // always returns both, so a message can never outlive the state that
    // justified it - `patchDiscountRate` merges, and the partial writes this
    // replaced could leave an overlap complaint on one field quoting a date
    // range the admin had already changed on the other.
    const minDate = new Date().toISOString().split("T")[0];
    set(
      resourceDataAtom,
      patchDiscountRate(data, rateId, {
        ...changes,
        ...validateRateDates({ ...rate, ...changes }, discountRates, minDate, MAX_DATE),
      }),
    );
  },
);

export const addExchangeRateAtom = atom(null, (get, set) => {
  const data = get(resourceDataAtom);
  const discountRates = data?.resource_details.exchange_rates?.discount_rates ?? [];
  if (!data) return;

  let latestEndDate = new Date();
  discountRates.forEach((rate) => {
    if (rate.end_date) {
      const endDate = new Date(rate.end_date);
      if (endDate > latestEndDate) latestEndDate = endDate;
    }
  });

  const startDate = new Date(latestEndDate);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 15);

  const newRate: DiscountRate = {
    id: Date.now(),
    exchange_rate: "1.0",
    begin_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    is_new: true,
  };

  set(
    resourceDataAtom,
    updateExchangeRates(data, (rates) => ({
      discount_rates: [...(rates.discount_rates ?? []), newRate],
    })),
  );
});

export const deleteExchangeRateAtom = atom(null, (get, set, rateId: number) => {
  const data = get(resourceDataAtom);
  if (!data) return;

  const withoutRate = updateExchangeRates(data, (rates) => ({
    discount_rates: rates.discount_rates?.filter((rate) => rate.id !== rateId),
  }));

  const remainingRates = withoutRate.resource_details.exchange_rates?.discount_rates ?? [];
  const cleared = updateExchangeRates(withoutRate, () => ({
    discount_rates: remainingRates.map((rate) =>
      rate.begin_date && rate.end_date
        ? { ...rate, start_date_error: "", end_date_error: "" }
        : rate,
    ),
  }));

  set(resourceDataAtom, cleared);
});

export const submitResourceAtom = atom(null, async (get, set) => {
  const resourceDetails = get(resourceDetailsAtom);
  if (!resourceDetails) return false;

  const updatedResource = {
    resource_name: resourceDetails.resource_name,
    description: resourceDetails.description,
    resource_type_id: resourceDetails.resource_type_id,
    unit_type_id: resourceDetails.unit_type_id,
    min_exchange: resourceDetails.min_exchange,
    dollar_value: resourceDetails.dollar_value,
    allocation_types: resourceDetails.allocation_types.map((type) => ({
      allocation_type_id: type.allocation_type_id,
      allowed_action: { resource_state_type_id: type.allowed_action?.resource_state_type_id },
      comment: type.comment ?? "",
    })),
    exchange_rates: {
      base_rate: resourceDetails.exchange_rates?.base_rate,
      discount_rates: resourceDetails.exchange_rates?.discount_rates?.map((rate) => ({
        id: rate.id,
        exchange_rate: rate.exchange_rate,
        begin_date: rate.begin_date,
        end_date: rate.end_date,
      })),
    },
  };

  const requiredResources: Record<number, number[]> = {};
  resourceDetails.allocation_types.forEach((type) => {
    type.required_resources?.forEach((resource) => {
      (requiredResources[resource.required_resource_id] ??= []).push(type.allocation_type_id);
    });
  });

  try {
    const response = await updateResourceData(
      get(resourceIdAtom),
      get(relativeUrlRootAtom),
      updatedResource,
      requiredResources,
    );
    if (response.ok) {
      const result = await response.json();
      set(successMessageAtom, {
        message: result.message ?? "Resource updated successfully!",
        color: "success",
      });
      await set(fetchResourceDataAtom);
      return true;
    }
    set(errorsAtom, await errorsFromResponse(response, "Failed to update resource"));
    return false;
  } catch (error) {
    console.error("Failed to update resource:", error);
    set(successMessageAtom, {
      message: "Error updating resource. Please try again later.",
      color: "danger",
    });
    return false;
  }
});
