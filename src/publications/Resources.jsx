import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAvailableResources,
  getSelectedResources,
  updateSelectedResources,
  getResourcesNoneSelected,
  setResourcesNoneSelected,
} from "./helpers/publicationEditSlice";

export default function Resources() {
  const dispatch = useDispatch();
  const availableResources = useSelector(getAvailableResources);
  const selectedResourceIds = useSelector(getSelectedResources);
  const resourcesNoneSelected = useSelector(getResourcesNoneSelected);

  const resourceOptions = useMemo(() => {
    return availableResources
      .filter((resource) => {
        // Never show Access Credits
        const label = resource.label || resource.value || "";
        return label.toLowerCase() !== "access credits";
      })
      .map((resource) => ({
        resource_id: resource.resource_id,
        label: resource.label || resource.value || resource.resource_name || "",
        value: resource.value || resource.label || resource.resource_name || "",
        providerAbbrev: resource.organization_abbrev,
        providerName: resource.organization_name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableResources]);

  const groupedResources = useMemo(() => {
    const groups = {};
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
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [resourceOptions]);

  const handleResourceToggle = (resourceId, checked) => {
    if (resourcesNoneSelected) {
      dispatch(setResourcesNoneSelected(false));
    }
    const current = selectedResourceIds || [];
    const resourceIdNum = Number(resourceId); // Ensure consistent type
    let nextIds;

    if (checked) {
      nextIds = current.includes(resourceIdNum) ? current : [...current, resourceIdNum];
    } else {
      nextIds = current.filter((id) => Number(id) !== resourceIdNum);
    }

    dispatch(updateSelectedResources(nextIds));
  };

  const handleNoneToggle = (checked) => {
    dispatch(setResourcesNoneSelected(checked));
  };

  const renderResourceOption = (resource, optionIndex) => (
    <div className="form-check" key={`resource_${resource.resource_id}`}>
      <input
        className="form-check-input"
        type="checkbox"
        id={`resource_used_${resource.resource_id}_${optionIndex}`}
        checked={selectedResourceIds.includes(Number(resource.resource_id))}
        disabled={resourcesNoneSelected}
        onChange={(e) =>
          handleResourceToggle(Number(resource.resource_id), e.target.checked)
        }
      />
      <label
        className="form-check-label"
        htmlFor={`resource_used_${resource.resource_id}_${optionIndex}`}
      >
        {resource.label}
      </label>
    </div>
  );

  return (
    <div className="mb-4">
      <div className="fw-bold mb-2">
        Resources
        <i className="bi bi-asterisk text-danger"></i>
      </div>

      <div className="text-muted small mb-2">
        Select a project above to see available resources.
      </div>

      {!resourcesNoneSelected && selectedResourceIds.length === 0 && (
        <div className="alert alert-danger">
          Select at least one resource or choose &quot;This is an ACCESS staff publication&quot;.
        </div>
      )}

      {resourceOptions.length > 0 && (
        <>
          {Object.entries(groupedResources).map(([providerKey, group]) => (
            <div key={`provider_${providerKey}`} className="mb-3">
              <div
                className="fw-semibold text-muted mb-2"
                style={{ fontSize: "0.95em" }}
              >
                {group.providerName || providerKey}
              </div>
              <div className="ms-3">
                {group.resources.map((resource, optionIndex) =>
                  renderResourceOption(resource, optionIndex),
                )}
              </div>
            </div>
          ))}
        </>
      )}

      <div className="form-check mt-2">
        <input
          className="form-check-input"
          type="checkbox"
          id="resources_none"
          checked={resourcesNoneSelected}
          onChange={(e) => handleNoneToggle(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="resources_none">
          This is an ACCESS staff publication
        </label>
      </div>
    </div>
  );
}

