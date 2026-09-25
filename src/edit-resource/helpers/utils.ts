import type { ResourceData } from "../types";

export const fetchResourceData = async (
  resourceId: number,
  relativeUrlRoot: string,
): Promise<ResourceData> => {
  const response = await fetch(
    `${relativeUrlRoot}/resources/${resourceId}.json`,
  );
  return await response.json();
};

export const updateResourceData = async (
  resourceId: number,
  relativeUrlRoot: string,
  updatedResource: unknown,
  requiredResources: Record<number, number[]>,
): Promise<Response> => {
  const csrfToken = document.querySelector<HTMLMetaElement>(
    'meta[name="csrf-token"]',
  )?.content;

  return await fetch(`${relativeUrlRoot}/resources/${resourceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken ?? "",
    },
    body: JSON.stringify({
      resource: updatedResource,
      required_resources: requiredResources,
    }),
  });
};
