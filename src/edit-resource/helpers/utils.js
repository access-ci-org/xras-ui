export const fetchResourceData = async (resourceId, relativeUrlRoot) => {
  const response = await fetch(
    `${relativeUrlRoot}/resources/${resourceId}.json`
  );
  return await response.json();
};

export const updateResourceData = async (
  resourceId,
  relativeUrlRoot,
  updatedResource,
  requiredResources
) => {
  const response = await fetch(`${relativeUrlRoot}/resources/${resourceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
    },
    body: JSON.stringify({
      resource: updatedResource,
      required_resources: requiredResources,
    }),
  });
  return response;
};
