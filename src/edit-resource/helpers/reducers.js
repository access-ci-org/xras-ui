export const resources = (state, action) => {
  switch (action.type) {
    case "SET_RESOURCE_DATA":
      return { ...state, resourceData: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_SUCCESS_MESSAGE":
      return { ...state, successMessage: action.payload };
    case "SET_ERRORS":
      return {
        ...state,
        errors: Array.isArray(action.payload)
          ? action.payload
          : [action.payload],
        loading: false,
      };
    case "UPDATE_RESOURCE_FIELD":
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          resource_details: {
            ...state.resourceData.resource_details,
            [action.field]: action.value,
          },
        },
      };
    case "UPDATE_ALLOCATION":
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          resource_details: {
            ...state.resourceData.resource_details,
            allocation_types:
              state.resourceData.resource_details.allocation_types.map(
                (alloc) =>
                  alloc.allocation_type_id === action.payload.allocationTypeId
                    ? { ...alloc, ...action.payload.updates }
                    : alloc
              ),
          },
        },
      };

    case "UPDATE_BASE_RATE":
      console.log("Reducer: Updating base rate to:", action.payload);
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          resource_details: {
            ...state.resourceData.resource_details,
            exchange_rates: {
              ...state.resourceData.resource_details.exchange_rates,
              base_rate: action.payload,
            },
          },
        },
      };

    case "UPDATE_EXCHANGE_RATE":
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          resource_details: {
            ...state.resourceData.resource_details,
            exchange_rates: {
              ...state.resourceData.resource_details.exchange_rates,
              discount_rates:
                state.resourceData.resource_details.exchange_rates.discount_rates.map(
                  (rate) =>
                    rate.id === action.payload.rateId
                      ? { ...rate, ...action.payload.changes }
                      : rate
                ),
            },
          },
        },
      };

    case "ADD_EXCHANGE_RATE":
      console.log("Reducer: Adding new discount rate:", action.payload);
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          resource_details: {
            ...state.resourceData.resource_details,
            exchange_rates: {
              ...state.resourceData.resource_details.exchange_rates,
              discount_rates: [
                ...(state.resourceData.resource_details.exchange_rates
                  .discount_rates || []),
                action.payload,
              ],
            },
          },
        },
      };
    case "DELETE_EXCHANGE_RATE":
      return {
        ...state,
        resourceData: {
          ...state.resourceData,
          resource_details: {
            ...state.resourceData.resource_details,
            exchange_rates: {
              ...state.resourceData.resource_details.exchange_rates,
              discount_rates:
                state.resourceData.resource_details.exchange_rates.discount_rates.filter(
                  (rate) => rate.id !== action.payload
                ),
            },
          },
        },
      };
    default:
      return state;
  }
};
