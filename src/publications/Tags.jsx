import { useDispatch, useSelector } from "react-redux";
import {
  getPublicationTags,
  updateSelectedTags,
  lookupResourceProviders,
} from "./helpers/publicationEditSlice";

export default function Tags({ category, index }) {
  const dispatch = useDispatch();
  const publicationTags = useSelector(getPublicationTags);
  const selectedTags = useSelector((state) => state.publicationEdit.selected_tags || {});

  // Get selected tag values for this category
  const getSelectedValues = () => {
    const selectedValues = selectedTags[category.label] || [];
    
    // If we have selected tags, return them
    if (selectedValues.length > 0) {
      return selectedValues;
    }
    
    // Otherwise, check publicationTags for initial values
    const selected = publicationTags.filter(
      (pt) => pt.label == category.label,
    )[0];
    if (selected) {
      return selected.options.map(opt => opt.value);
    }

    return [];
  };

  const selectedValues = getSelectedValues();

  const handleCheckboxChange = (tagValue, isChecked) => {
    const currentValues = selectedTags[category.label] || [];
    let newValues;
    
    if (isChecked) {
      // Add the tag if checked
      newValues = [...currentValues, tagValue];
    } else {
      // Remove the tag if unchecked
      newValues = currentValues.filter(v => v !== tagValue);
    }
    
    // Convert to react-select format for compatibility
    // Use category.options directly (they already include "None" if needed)
    const tagObjects = category.options.filter(opt => newValues.includes(opt.value));
    
    dispatch(updateSelectedTags({ category: category.label, tags: tagObjects }));
    
    // If this is the Resource category, look up Resource Provider tags
    if (category.label === "Resource") {
      // Get resource names from tag objects (use label if available, otherwise value)
      const resourceNames = tagObjects
        .filter(t => t.value !== "None")
        .map(t => t.label || t.value);
      
      if (resourceNames.length > 0) {
        dispatch(lookupResourceProviders(resourceNames));
      } else {
        // Clear Resource Provider tags if no resources selected
        dispatch(lookupResourceProviders([]));
      }
    }
  };

  // Use category.options directly (they already include "None" if needed from the reducer)
  const options = category.options || [];

  return (
    <>
      <div className={"fw-bold mb-2"}>{category.label}</div>
      <div className={"mb-3"}>
        {options.map((option) => {
          const checkboxId = `tag_${index}_${option.value}`;
          const isChecked = selectedValues.includes(option.value);
          
          return (
            <div key={option.value} className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={checkboxId}
                value={option.value}
                checked={isChecked}
                onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
              />
              <label className="form-check-label" htmlFor={checkboxId}>
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}
