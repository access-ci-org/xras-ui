import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useResourceOptions } from "../edit-resource/helpers/hooks";

import Alert from "../shared/Alert";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import { ResourceForm } from "../edit-resource/ResourceForm";

export default function ImportResource({ setCanSave }) {
  const [addableResources, setAddableResources] = useState(null);
  const [selectedCiderResourceId, setSelectedCiderResourceId] = useState(-1);
  const [resourceData, setResourceData] = useState(null);
  const resourceFormOptions = useResourceOptions(resourceData);

  // Add placeholder options.
  resourceFormOptions["resourceTypesOptions"].unshift({
    value: 0,
    label: "Select a resource type...",
  });
  resourceFormOptions["unitTypesOptions"].unshift({
    value: 0,
    label: "Select a unit type...",
  });

  // Fetch a list of addable resources.
  useEffect(() => {
    (async () => {
      const res = await fetch("/resources/addable.json");
      if (res.status == 200) {
        setAddableResources(await res.json());
      } else {
        // TODO: Handle error fetching addable resources.
      }
    })();
  }, []);

  // Fetch details for the selected resource.
  useEffect(() => {
    if (selectedCiderResourceId === -1) return setResourceData(null);
    (async () => {
      const res = await fetch(
        `/resources/addable/${selectedCiderResourceId}.json`
      );
      if (res.status == 200) {
        setResourceData(await res.json());
      } else {
        // TODO: Handle error fetching addable resources.
      }
    })();
  }, [selectedCiderResourceId]);

  // Validate that required fields are filled in.
  useEffect(() => {
    if (!resourceData) return;
    const details = resourceData.resource_details;
    setCanSave(
      details.resource_name.length > 0 &&
        details.dollar_value > 0 &&
        details.resource_type_id > 0 &&
        details.unit_type_id > 0
    );
  }, [resourceData]);

  if (addableResources === null) return <p>Loading&hellip;</p>;
  if (addableResources.length == 0)
    return <Alert>There are currently no resources available to add.</Alert>;

  const resourceOptions = [{ value: -1, label: "Select a resource..." }].concat(
    addableResources.map((res) => ({
      value: res.xras_cider_resource_id,
      label: res.resource_descriptive_name,
    }))
  );

  console.log({ resourceData });

  const dispatchResourceChange = (action) => {
    if (action.type == "UPDATE_RESOURCE_FIELD")
      setResourceData({
        ...resourceData,
        resource_details: {
          ...resourceData.resource_details,
          [action.field]: action.value,
        },
      });
  };

  return (
    <>
      <h2>Select a Resource to Add</h2>
      <SelectInput
        options={resourceOptions}
        onChange={(e) => setSelectedCiderResourceId(parseInt(e.target.value))}
      ></SelectInput>
      {resourceData && (
        <>
          <h2>Resource Properties</h2>
          <p
            style={{
              fontStyle: "italic",
              fontWeight: "bold",
            }}
          >
            Any modifications to these resource properties will be applied
            globally and impact resources on other all allocations process
          </p>
          <ResourceForm
            resourceDetails={resourceData["resource_details"]}
            resourceTypesOptions={resourceFormOptions["resourceTypesOptions"]}
            unitTypesOptions={resourceFormOptions["unitTypesOptions"]}
            showResourceId={false}
            useAdvancedSettings={false}
            dispatch={dispatchResourceChange}
          />
        </>
      )}
    </>
  );
}

ImportResource.propTypes = {
  setCanSave: PropTypes.func.isRequired,
};
