export const fetchResourceData = async (resourceId) => {
    const response = await fetch(`/resources/${resourceId}.json`);
    return await response.json();
  };
  
  export const updateResourceData = async (resourceId, updatedResource) => {
    const response = await fetch(`/resources/${resourceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ resource: updatedResource }),
    });
    return response;
  };
  