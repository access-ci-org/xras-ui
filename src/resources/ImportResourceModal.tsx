import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import Alert from "../shared/Alert";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import { AddNewModal } from "../edit-resource/AddNewModal";
import { ResourceForm } from "../edit-resource/ResourceForm";
import { resourceDataAtom, resourceDetailsAtom } from "../edit-resource/atoms";
import type { ResourceData } from "../edit-resource/types";

type AddableResource = {
  xras_cider_resource_id: number;
  resource_descriptive_name: string;
};

function ImportResourceModalInner({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [addableResources, setAddableResources] = useState<AddableResource[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCiderResourceId, setSelectedCiderResourceId] = useState(-1);
  const resourceData = useAtomValue(resourceDataAtom);
  const setResourceData = useSetAtom(resourceDataAtom);
  const resourceDetails = useAtomValue(resourceDetailsAtom);

  useEffect(() => {
    (async () => {
      const res = await fetch("/resources/addable.json");
      setLoading(false);
      if (res.status === 200) {
        setAddableResources(await res.json());
      } else {
        setErrorMessage("Error retrieving resource list.");
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCiderResourceId === -1) {
      setResourceData(null);
      return;
    }
    (async () => {
      const res = await fetch(`/resources/addable/${selectedCiderResourceId}.json`);
      if (res.status !== 200) {
        setErrorMessage("Error retrieving resource details.");
        return;
      }
      const data: ResourceData = await res.json();
      setResourceData({
        ...data,
        resource_types_available: [
          { resource_type_id: 0, display_resource_type: "Select a resource type..." },
          ...(data.resource_types_available ?? []),
        ],
        unit_types_available: [
          { unit_type_id: 0, display_unit_type: "Select a unit type..." },
          ...(data.unit_types_available ?? []),
        ],
        resource_details: {
          ...data.resource_details,
          allocation_types: data.resource_details.allocation_types ?? [],
        },
      });
    })();
  }, [selectedCiderResourceId]);

  const canSave =
    !errorMessage &&
    !!resourceDetails &&
    resourceDetails.resource_name.length > 0 &&
    Number(resourceDetails.resource_type_id) > 0 &&
    Number(resourceDetails.unit_type_id) > 0;

  const saveResource = async () => {
    if (!resourceDetails) return;
    const csrfToken = document.querySelector<HTMLMetaElement>(
      'meta[name="csrf-token"]',
    )?.content;
    const res = await fetch("/resources", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken ?? "",
      },
      body: JSON.stringify({
        ...resourceDetails,
        resource_repository_key: selectedCiderResourceId,
      }),
    });
    if (res.status === 200) {
      const data = await res.json();
      window.location.href = `/resources/${data.resource_id}`;
    } else {
      setErrorMessage("Error saving resource.");
    }
  };

  let modalContent: ReactNode = null;
  if (loading) {
    modalContent = <p>Loading&hellip;</p>;
  } else if (errorMessage !== null) {
    modalContent = <Alert color="danger">{errorMessage}</Alert>;
  } else if (addableResources.length === 0) {
    modalContent = <Alert color="info">There are currently no resources available to add.</Alert>;
  }

  // Create an array of resource options.
  const resourceOptions = [{ value: -1, label: "Select a resource..." }].concat(
    addableResources.map((res) => ({
      value: res.xras_cider_resource_id,
      label: res.resource_descriptive_name,
    })),
  );

  if (modalContent === null) {
    modalContent = (
      <>
        <h2>Select a Resource to Add</h2>
        <SelectInput
          options={resourceOptions}
          value={selectedCiderResourceId}
          onChange={(e) => setSelectedCiderResourceId(parseInt(e.target.value))}
        />
        {!resourceData && selectedCiderResourceId !== -1 && <p>Loading&hellip;</p>}
        {resourceData && (
          <>
            <h2 className="mt-4">Resource Properties</h2>
            <p className="mb-3 font-bold italic">
              Any modifications to these resource properties will be applied globally and impact
              resources on other all allocations process
            </p>
            <ResourceForm showResourceId={false} showDollarValue={false} />
          </>
        )}
      </>
    );
  }

  return (
    <AddNewModal
      show
      onClose={onClose}
      title="Add a Resource from CIDeR"
      onSave={saveResource}
      buttonText="Save"
      canSave={canSave}
    >
      {modalContent}
    </AddNewModal>
  );
}

export default function ImportResourceModal({ onClose }: { onClose: () => void }) {
  const store = useMemo(() => createStore(), []);

  return (
    <Provider store={store}>
      <ImportResourceModalInner onClose={onClose} />
    </Provider>
  );
}
