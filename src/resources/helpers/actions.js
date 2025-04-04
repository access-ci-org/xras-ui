export const updateResources = (newResources) => ({
  type: "UPDATE_RESOURCES",
  payload: newResources,
});

export const updateBackend = async (relativeUrlRoot, updatedResources) => {
  try {
    const response = await fetch(`${relativeUrlRoot}/resources`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
          .content,
      },
      body: JSON.stringify({
        resources: updatedResources.map((resource, index) => ({
          resource_id: resource.resource_id,
          relative_order: index + 1,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update resource order");
    }

    const result = await response.json();
    console.log(result.message);
  } catch (error) {
    console.error("Error updating resource order:", error);
  }
};
