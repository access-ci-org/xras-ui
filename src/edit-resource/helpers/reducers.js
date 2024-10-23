export const resources = (state, action) => {
    switch (action.type) {
      case 'SET_RESOURCE_DATA':
        return { ...state, resourceData: action.payload, loading: false };
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_SUCCESS_MESSAGE':
        return { ...state, successMessage: action.payload };
      case 'SET_ERRORS':
        return { ...state, errors: Array.isArray(action.payload) ? action.payload : [action.payload], loading: false };
      case 'UPDATE_RESOURCE_FIELD':
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
        case 'UPDATE_ALLOCATION':
          return {
            ...state,
            resourceData: {
              ...state.resourceData,
              resource_details: {
                ...state.resourceData.resource_details,
                allocation_types: state.resourceData.resource_details.allocation_types.map(alloc =>
                  alloc.allocation_type_id === action.payload.allocationTypeId
                    ? { ...alloc, ...action.payload.updates }
                    : alloc
                ),
              },
            },
          };
      default:
        return state;
    }
  };
  