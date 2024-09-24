export const setResourceData = (data) => ({
    type: 'SET_RESOURCE_DATA',
    payload: data,
  });
  
  export const setLoading = (loading) => ({
    type: 'SET_LOADING',
    payload: loading,
  });
  
  export const setSuccessMessage = (message, color) => ({
    type: 'SET_SUCCESS_MESSAGE',
    payload: { message, color },
  });
  
  export const updateResourceField = (field, value) => ({
    type: 'UPDATE_RESOURCE_FIELD',
    field,
    value,
  });
  
  export const updateAllocation = (type, updates) => ({
    type: 'UPDATE_ALLOCATION',
    payload: { type, updates },
  });
  