import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Asterisk } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Alert from "../shared/Alert";
import {
  availableResourcesAtom,
  resourcesNoneSelectedAtom,
  selectedResourcesAtom,
  setResourcesNoneSelectedAtom,
  updateSelectedResourcesAtom,
} from "./atoms";

export default function Resources() {
  const availableResources = useAtomValue(availableResourcesAtom);
  const selectedResourceIds = useAtomValue(selectedResourcesAtom);
  const resourcesNoneSelected = useAtomValue(resourcesNoneSelectedAtom);
  const updateSelectedResources = useSetAtom(updateSelectedResourcesAtom);
  const setResourcesNoneSelected = useSetAtom(setResourcesNoneSelectedAtom);

  const resourceOptions = useMemo(() => {
    return availableResources
      .filter((resource) => {
        const label = resource.label || resource.value || "";
        return label.toLowerCase() !== "access credits";
      })
      .map((resource) => ({
        resource_id: resource.resource_id,
        label: resource.label || resource.value || resource.resource_name || "",
        providerAbbrev: resource.organization_abbrev,
        providerName: resource.organization_name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableResources]);

  const groupedResources = useMemo(() => {
    const groups: Record<
      string,
      { providerAbbrev?: string; providerName?: string; resources: typeof resourceOptions }
    > = {};
    resourceOptions.forEach((resource) => {
      const providerKey = resource.providerAbbrev || "Other";
      if (!groups[providerKey]) {
        groups[providerKey] = {
          providerAbbrev: resource.providerAbbrev,
          providerName: resource.providerName,
          resources: [],
        };
      }
      groups[providerKey].resources.push(resource);
    });

    return Object.keys(groups)
      .sort()
      .reduce<typeof groups>((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [resourceOptions]);

  const handleResourceToggle = (resourceId: number, checked: boolean) => {
    if (resourcesNoneSelected) setResourcesNoneSelected(false);
    const current = selectedResourceIds || [];
    const nextIds = checked
      ? current.includes(resourceId)
        ? current
        : [...current, resourceId]
      : current.filter((id) => id !== resourceId);
    updateSelectedResources(nextIds);
  };

  return (
    <div className="mb-4">
      <div className="mb-2 font-bold">
        Resources
        <Asterisk className="ml-1 inline size-3.5 text-destructive" />
      </div>

      <div className="mb-2 text-sm text-muted-foreground">
        Select a project above to see available resources.
      </div>

      {!resourcesNoneSelected && selectedResourceIds.length === 0 && (
        <Alert color="danger">
          Select at least one resource or choose &quot;This is an ACCESS staff publication&quot;.
        </Alert>
      )}

      {resourceOptions.length > 0 && (
        <>
          {Object.entries(groupedResources).map(([providerKey, group]) => (
            <div key={providerKey} className="mb-3">
              <div className="mb-2 text-sm font-semibold text-muted-foreground">
                {group.providerName || providerKey}
              </div>
              <div className="ml-3 flex flex-col gap-1">
                {group.resources.map((resource, optionIndex) => (
                  <label
                    key={`${resource.resource_id}_${optionIndex}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedResourceIds.includes(Number(resource.resource_id))}
                      disabled={resourcesNoneSelected}
                      onCheckedChange={(checked) =>
                        handleResourceToggle(Number(resource.resource_id), checked === true)
                      }
                    />
                    {resource.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <label className="mt-2 flex items-center gap-2 text-sm">
        <Checkbox
          checked={resourcesNoneSelected}
          onCheckedChange={(checked) => setResourcesNoneSelected(checked === true)}
        />
        <Label>This is an ACCESS staff publication</Label>
      </label>
    </div>
  );
}
