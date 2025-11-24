import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getSelectedTagsByCategory,
  updateSelectedTags,
  setResourceNoneSelected,
  getAvailableResources,
  getResourceNoneSelected,
  getSelectedResourceTags,
  RESOURCE_TAG_CATEGORY,
} from "./helpers/publicationEditSlice";

const RESOURCE_PROVIDER_LABEL = "resource provider";

export default function Tags({ category, index }) {
  const dispatch = useDispatch();
  const selectedTags = useSelector(getSelectedTagsByCategory);
  const availableResources = useSelector(getAvailableResources);
  const resourceNoneSelected = useSelector(getResourceNoneSelected);
  const selectedResourceTags = useSelector(getSelectedResourceTags);

  const isResourceCategory = category.label === RESOURCE_TAG_CATEGORY;
  const isResourceProviderCategory =
    category.label?.toLowerCase() === RESOURCE_PROVIDER_LABEL;

  const selectedValues = selectedTags[category.label] || [];

  const resourceOptions = useMemo(() => {
    if (!isResourceCategory) return [];

    const optionMap = new Map(
      category.options.map((option) => [option.value, option]),
    );

    return availableResources
      .filter((resource) => {
        // Never show Access Credits
        const option = optionMap.get(resource.value);
        const label = option?.label || resource.label || resource.value;
        return label.toLowerCase() !== "access credits";
      })
      .map((resource) => {
        const option = optionMap.get(resource.value);
        return {
          value: resource.value,
          label: option?.label || resource.label || resource.value,
          providerAbbrev: resource.organization_abbrev,
          providerName: resource.organization_name,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableResources, category.options, isResourceCategory]);

  const groupedResources = useMemo(() => {
    if (!isResourceCategory) return {};

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
  }, [resourceOptions, isResourceCategory]);

  if (isResourceProviderCategory) {
    return null;
  }

  const handleToggle = (categoryLabel, value, checked) => {
    const current = selectedTags[categoryLabel] || [];
    let nextValues;

    if (checked) {
      nextValues = current.includes(value) ? current : [...current, value];
    } else {
      nextValues = current.filter((item) => item !== value);
    }

    dispatch(updateSelectedTags({ category: categoryLabel, values: nextValues }));
  };

  const handleResourceToggle = (value, checked) => {
    if (resourceNoneSelected) {
      dispatch(setResourceNoneSelected(false));
    }
    handleToggle(RESOURCE_TAG_CATEGORY, value, checked);
  };

  const handleNoneToggle = (checked) => {
    dispatch(setResourceNoneSelected(checked));
  };

  const renderOption = (option, optionIndex) => (
    <div className="form-check" key={`${category.label}_${option.value}`}>
      <input
        className="form-check-input"
        type="checkbox"
        id={`tag_${index}_${optionIndex}`}
        checked={selectedValues.includes(option.value)}
        onChange={(e) => handleToggle(category.label, option.value, e.target.checked)}
      />
      <label className="form-check-label" htmlFor={`tag_${index}_${optionIndex}`}>
        {option.label}
      </label>
    </div>
  );

  const renderResourceOption = (option, optionIndex) => (
    <div className="form-check" key={`resource_${option.value}`}>
      <input
        className="form-check-input"
        type="checkbox"
        id={`resource_${index}_${optionIndex}`}
        checked={selectedValues.includes(option.value)}
        disabled={resourceNoneSelected}
        onChange={(e) => handleResourceToggle(option.value, e.target.checked)}
      />
      <label
        className="form-check-label"
        htmlFor={`resource_${index}_${optionIndex}`}
      >
        {option.label}
      </label>
    </div>
  );

  return (
    <div className="mb-4">
      <div className="fw-bold mb-2">
        {category.label}
        {isResourceCategory && (
          <i className="bi bi-asterisk text-danger"></i>
        )}
      </div>

      {!isResourceCategory &&
        category.options.map((option, optionIndex) =>
          renderOption(option, optionIndex),
        )}

      {isResourceCategory && (
        <>
          <div className="text-muted small mb-2">
            Select a project above to see available resources.
          </div>

          {!resourceNoneSelected && selectedResourceTags.length === 0 && (
            <div className="alert alert-danger">
              Select at least one resource or choose &quot;This is an ACCESS staff publication&quot;.
            </div>
          )}

          {resourceOptions.length > 0 && (
            <>
              {Object.entries(groupedResources).map(([providerKey, group]) => (
                <div key={`provider_${providerKey}`} className="mb-3">
                  <div className="fw-semibold text-muted mb-2" style={{ fontSize: '0.95em' }}>
                    {group.providerName || providerKey}
                  </div>
                  <div className="ms-3">
                    {group.resources.map((option, optionIndex) =>
                      renderResourceOption(option, optionIndex),
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
              id={`resource_none_${index}`}
              checked={resourceNoneSelected}
              onChange={(e) => handleNoneToggle(e.target.checked)}
            />
            <label className="form-check-label" htmlFor={`resource_none_${index}`}>
              This is an ACCESS staff publication
            </label>
          </div>
        </>
      )}
    </div>
  );
}
