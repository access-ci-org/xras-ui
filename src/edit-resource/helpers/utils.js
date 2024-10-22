export const fetchResourceData = async (resourceId, relative_url_root) => {
    const response = await fetch(`${relative_url_root}/resources/${resourceId}.json`);
    return await response.json();
  };
  
  export const updateResourceData = async (resourceId, relative_url_root, updatedResource, requiredResources) => {
    const response = await fetch(`${relative_url_root}/resources/${resourceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ 
        resource: updatedResource,
        required_resources: requiredResources,
      }),
    });
    return response;
  };
  