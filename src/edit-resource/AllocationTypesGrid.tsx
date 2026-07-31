import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Grid, { type GridColumn } from "../shared/Grid";
import { AddNewModal } from "./AddNewModal";
import { AdvancedSettingsSection } from "./AdvancedSettingsSection";
import {
  allowedActionsOptionsAtom,
  availableAllocationTypesAtom,
  availableResourcesAtom,
  changeAllowedActionAtom,
  changeCommentAtom,
  changeRequiredResourceAtom,
  isAllocationEditingAtom,
  requiredResourceNamesAtom,
  resourceDetailsAtom,
  saveAllocationTypeAtom,
  saveRequiredResourcesAtom,
  showAddAllocationTypeModalAtom,
  showAddResourceModalAtom,
} from "./atoms";

const AllocationGridHeader = ({
  isEditing,
  onAddAllocationType,
  onAddRequiredResource,
}: {
  isEditing: boolean;
  onAddAllocationType: () => void;
  onAddRequiredResource: () => void;
}) => (
  <div className="flex gap-4">
    <Button onClick={() => isEditing && onAddAllocationType()}>
      <Plus className="size-4" /> Add Allocation Type
    </Button>
    <Button onClick={() => isEditing && onAddRequiredResource()}>
      <Plus className="size-4" /> Add Required Resource
    </Button>
  </div>
);

const AddRequiredResourceModal = () => {
  const show = useAtomValue(showAddResourceModalAtom);
  const setShow = useSetAtom(showAddResourceModalAtom);
  return show ? <AddRequiredResourceForm onClose={() => setShow(false)} /> : null;
};

const AddRequiredResourceForm = ({ onClose }: { onClose: () => void }) => {
  const availableResources = useAtomValue(availableResourcesAtom);
  const resourceDetails = useAtomValue(resourceDetailsAtom);
  const saveRequiredResources = useSetAtom(saveRequiredResourcesAtom);

  const existingResourceIds = useMemo(
    () =>
      resourceDetails?.allocation_types
        .flatMap((type) => type.required_resources ?? [])
        .map((resource) => resource.required_resource_id) ?? [],
    [],
  );

  const form = useAppForm({
    defaultValues: { resourceIds: existingResourceIds },
    onSubmit: ({ value }) => {
      if (saveRequiredResources(value.resourceIds)) onClose();
    },
  });

  return (
    <AddNewModal
      show
      onClose={onClose}
      title="Add Required Resource"
      onSave={() => form.handleSubmit()}
      buttonText="Save"
    >
      <form.Field name="resourceIds">
        {(field) => (
          <div className="flex flex-col gap-2">
            {availableResources.map((resource) => (
              <label
                key={resource.resource_id}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Checkbox
                  checked={field.state.value.includes(resource.resource_id)}
                  onCheckedChange={(checked) =>
                    field.handleChange(
                      checked
                        ? [...field.state.value, resource.resource_id]
                        : field.state.value.filter((id) => id !== resource.resource_id),
                    )
                  }
                />
                {resource.resource_name}
              </label>
            ))}
          </div>
        )}
      </form.Field>
    </AddNewModal>
  );
};

const AddAllocationTypeModal = () => {
  const show = useAtomValue(showAddAllocationTypeModalAtom);
  const setShow = useSetAtom(showAddAllocationTypeModalAtom);
  return show ? <AddAllocationTypeForm onClose={() => setShow(false)} /> : null;
};

const AddAllocationTypeForm = ({ onClose }: { onClose: () => void }) => {
  const availableAllocationTypes = useAtomValue(availableAllocationTypesAtom);
  const saveAllocationType = useSetAtom(saveAllocationTypeAtom);

  const form = useAppForm({
    defaultValues: { allocationTypeId: null as string | null },
    onSubmit: ({ value }) => {
      if (value.allocationTypeId && saveAllocationType(value.allocationTypeId)) onClose();
    },
  });

  return (
    <AddNewModal
      show
      onClose={onClose}
      title="Add Allocation Type"
      onSave={() => form.handleSubmit()}
      buttonText="Save"
    >
      <form.AppField name="allocationTypeId">
        {(field) => (
          <field.FieldSelect
            label="Select Allocation Type"
            placeholder="Select an allocation type to add"
            options={availableAllocationTypes.map((at) => ({
              value: at.allocation_type_id.toString(),
              label: at.display_name,
            }))}
          />
        )}
      </form.AppField>
    </AddNewModal>
  );
};

export const AllocationTypesSection = () => {
  const resourceDetails = useAtomValue(resourceDetailsAtom);
  const allowedActionsOptions = useAtomValue(allowedActionsOptionsAtom);
  const requiredResourceNames = useAtomValue(requiredResourceNamesAtom);
  const isEditing = useAtomValue(isAllocationEditingAtom);
  const setIsEditing = useSetAtom(isAllocationEditingAtom);
  const setShowAddAllocationTypeModal = useSetAtom(showAddAllocationTypeModalAtom);
  const setShowAddResourceModal = useSetAtom(showAddResourceModalAtom);
  const changeAllowedAction = useSetAtom(changeAllowedActionAtom);
  const changeComment = useSetAtom(changeCommentAtom);
  const changeRequiredResource = useSetAtom(changeRequiredResourceAtom);

  if (!resourceDetails) return null;

  const columns: GridColumn[] = [
    { key: "display_name", name: "Allocation Type", width: 200 },
    { key: "allowed_actions", name: "Allowed Actions", width: 200, type: "select" },
    {
      key: "comment",
      name: "Descriptive Text",
      width: 200,
      type: "input",
      tooltip:
        "Appears below the resource name and allocations description in the form when making a new request",
    },
    ...requiredResourceNames.map(
      (name): GridColumn => ({
        key: name,
        name: `Require ${name}`,
        width: 150,
        type: "checkbox",
      }),
    ),
  ];

  const rows = resourceDetails.allocation_types.map((type) => ({
    display_name: type.display_name,
    allowed_actions: {
      options: allowedActionsOptions,
      value: type.allowed_action?.resource_state_type_id ?? "",
      onChange: (value: string) =>
        changeAllowedAction({ allocationTypeId: type.allocation_type_id, resourceStateTypeId: value }),
    },
    comment: {
      value: type.comment ?? "",
      onChange: (value: string) =>
        changeComment({ allocationTypeId: type.allocation_type_id, comment: value }),
    },
    ...Object.fromEntries(
      requiredResourceNames.map((name) => [
        name,
        {
          checked: type.required_resources?.some((resource) => resource.resource_name === name) ?? false,
          onChange: (checked: boolean) =>
            changeRequiredResource({
              allocationTypeId: type.allocation_type_id,
              resourceName: name,
              checked,
            }),
        },
      ]),
    ),
  }));

  return (
    <>
      <AdvancedSettingsSection
        headerText={<h2>Allocation Types</h2>}
        header={
          <AllocationGridHeader
            isEditing={isEditing}
            onAddAllocationType={() => setShowAddAllocationTypeModal(true)}
            onAddRequiredResource={() => setShowAddResourceModal(true)}
          />
        }
        isEditing={isEditing}
        onEditingChange={setIsEditing}
        warningMessage="Incorrect allocations process settings can make a resource unavailable for allocation. Please proceed with caution."
      >
        <div className="mt-4">
          <Grid columns={columns} rows={rows} scroll={false} />
          <p className="mt-4 font-bold italic">
            Note: You may need to contact your Allocations Coordinator if you have added this
            resource to an allocation type.
          </p>
        </div>
      </AdvancedSettingsSection>
      <AddRequiredResourceModal />
      <AddAllocationTypeModal />
    </>
  );
};
