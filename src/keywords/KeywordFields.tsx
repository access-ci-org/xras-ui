import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AppForm } from "@/components/form";
import type { AllocationType } from "./types";

export type KeywordFormValues = {
  keyword: string;
  allocationTypeIds: number[];
};

export const KeywordInputField = ({
  form,
}: {
  form: AppForm<KeywordFormValues>;
}) => (
  <form.AppField name="keyword">
    {(field) => <field.FieldInput type="text" />}
  </form.AppField>
);

export const AllocationTypeCheckboxes = ({
  form,
  types,
  idPrefix,
}: {
  form: AppForm<KeywordFormValues>;
  types: AllocationType[];
  idPrefix: string;
}) => (
  <form.Field name="allocationTypeIds">
    {(field) => (
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${idPrefix}-select-all`}
            checked={field.state.value.length === types.length}
            onCheckedChange={() =>
              field.handleChange(
                field.state.value.length === types.length
                  ? []
                  : types.map((t) => t.allocation_type_id),
              )
            }
          />
          <Label htmlFor={`${idPrefix}-select-all`} className="font-normal">
            Select All
          </Label>
        </div>
        {types.map((type) => (
          <div key={type.allocation_type_id} className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-${type.allocation_type_id}`}
              checked={field.state.value.includes(type.allocation_type_id)}
              onCheckedChange={() =>
                field.handleChange(
                  field.state.value.includes(type.allocation_type_id)
                    ? field.state.value.filter((id) => id !== type.allocation_type_id)
                    : [...field.state.value, type.allocation_type_id],
                )
              }
            />
            <Label
              htmlFor={`${idPrefix}-${type.allocation_type_id}`}
              className="font-normal"
            >
              {type.display_allocation_type}
            </Label>
          </div>
        ))}
      </div>
    )}
  </form.Field>
);
