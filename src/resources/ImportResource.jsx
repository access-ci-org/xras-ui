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

  console.log(addableResources);

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

  if (addableResources === null) return <p>Loading&hellip;</p>;
  if (addableResources.length == 0)
    return <Alert>There are currently no resources available to add.</Alert>;

  const resourceOptions = [{ value: -1, label: "Select a resource..." }].concat(
    addableResources.map((res) => ({
      value: res.xras_cider_resource_id,
      label: res.resource_descriptive_name,
    }))
  );

  console.log({ resourceData, resourceFormOptions });

  return (
    <>
      <SelectInput
        options={resourceOptions}
        onChange={(e) => setSelectedCiderResourceId(parseInt(e.target.value))}
      ></SelectInput>
      {resourceData && (
        <ResourceForm
          resourceDetails={resourceData["resource_details"]}
          resourceTypesOptions={resourceFormOptions["resourceTypesOptions"]}
          unitTypesOptions={resourceFormOptions["unitTypesOptions"]}
          showResourceId={false}
          useAdvancedSettings={false}
        />
      )}
    </>
  );
}

ImportResource.propTypes = {
  setCanSave: PropTypes.func.isRequired,
};
