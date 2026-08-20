import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useAppForm } from "@/components/form";
import { cn } from "@/lib/utils";
import Grid, { type GridColumn } from "../shared/Grid";
import {
  ADMIN_BTN_ICON,
  ADMIN_BTN_PRIMARY,
  ADMIN_GRID,
  ADMIN_H2,
  ADMIN_LABEL,
  ADMIN_SELECT,
} from "../shared/adminTheme";
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
    <button
      type="button"
      className={ADMIN_BTN_PRIMARY}
      onClick={() => isEditing && onAddAllocationType()}
    >
      <Plus className={ADMIN_BTN_ICON} /> Add Allocation Type
    </button>
    <button
      type="button"
      className={ADMIN_BTN_PRIMARY}
      onClick={() => isEditing && onAddRequiredResource()}
    >
      <Plus className={ADMIN_BTN_ICON} /> Add Required Resource
    </button>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div>
            {availableResources.map((resource) => (
              <label
                key={resource.resource_id}
                className={cn(ADMIN_LABEL, "flex items-center gap-2")}
              >
                <input
                  type="checkbox"
                  className="m-0 size-[13px] cursor-pointer [accent-color:auto]"
                  checked={field.state.value.includes(resource.resource_id)}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.checked
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
      <form.Field name="allocationTypeId">
        {(field) => (
          <div>
            <label className={ADMIN_LABEL}>Select Allocation Type</label>
            <select
              className={ADMIN_SELECT}
              value={field.state.value ?? ""}
              onChange={(e) => field.handleChange(e.target.value)}
            >
              <option value="" disabled>
                Select an allocation type to add
              </option>
              {availableAllocationTypes.map((at) => (
                <option key={at.allocation_type_id} value={at.allocation_type_id}>
                  {at.display_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </form.Field>
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
        headerText={<h2 className={ADMIN_H2}>Allocation Types</h2>}
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
          <Grid columns={columns} rows={rows} classes={ADMIN_GRID} scroll={false} />
          <p className="m-0 text-sm font-bold italic">
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
