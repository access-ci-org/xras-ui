import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useResourceOptions } from "../edit-resource/helpers/hooks";
import style from "./ImportResourceModal.module.css";

import { AddNewModal } from "../edit-resource/AddNewModal";
import Alert from "../shared/Alert";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import { ResourceForm } from "../edit-resource/ResourceForm";

export default function ImportResourceModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [addableResources, setAddableResources] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
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
      setLoading(false);
      if (res.status == 200) {
        setAddableResources(await res.json());
      } else {
        setErrorMessage("Error retrieving resource list.");
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
        setErrorMessage("Error retrieving resource details.");
      }
    })();
  }, [selectedCiderResourceId]);

  let modalContent = null;
  if (loading) {
    modalContent = <p>Loading&hellip;</p>;
  } else if (errorMessage !== null) {
    modalContent = <Alert color="danger">{errorMessage}</Alert>;
  } else if (addableResources.length == 0) {
    modalContent = (
      <Alert>There are currently no resources available to add.</Alert>
    );
  }

  // Create an array of resource options.
  const resourceOptions = [{ value: -1, label: "Select a resource..." }].concat(
    addableResources.map((res) => ({
      value: res.xras_cider_resource_id,
      label: res.resource_descriptive_name,
    }))
  );

  // Validate that required fields are filled in.
  const details = resourceData ? resourceData.resource_details : null;
  const canSave =
    !errorMessage &&
    details &&
    details.resource_name.length > 0 &&
    details.resource_type_id > 0 &&
    details.unit_type_id > 0;

  // Update the state when form fields change.
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

  // Save resource.
  const saveResource = () => {
    (async () => {
      const res = await fetch("/resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
            .content,
        },
        body: JSON.stringify({
          ...details,
          resource_repository_key: selectedCiderResourceId,
        }),
      });
      if (res.status == 200) {
        // Redirect to the resource edit page.
        const data = await res.json();
        window.location = `/resources/${data.resource_id}`;
      } else {
        setErrorMessage("Error saving resource.");
      }
    })();
  };

  if (modalContent === null)
    modalContent = (
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
            <div className={style["form-wrapper"]}>
              <ResourceForm
                resourceDetails={details}
                resourceTypesOptions={
                  resourceFormOptions["resourceTypesOptions"]
                }
                unitTypesOptions={resourceFormOptions["unitTypesOptions"]}
                showResourceId={false}
                showDollarValue={false}
                dispatch={dispatchResourceChange}
              />
            </div>
          </>
        )}
      </>
    );

  return (
    <AddNewModal
      show={true}
      onClose={onClose}
      title="Add a Resource from CIDeR"
      onSave={saveResource}
      buttonText={"Save"}
      canSave={canSave}
    >
      {modalContent}
    </AddNewModal>
  );
}

ImportResourceModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
