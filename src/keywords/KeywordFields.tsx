import { cn } from "@/lib/utils";
import {
  ADMIN_CHECKBOX,
  ADMIN_CHECKBOX_INLINE,
  ADMIN_CHECKBOX_LABEL,
  ADMIN_CHECKBOX_LABEL_INLINE,
  ADMIN_INPUT,
} from "../shared/adminTheme";
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
  <form.Field name="keyword">
    {(field) => (
      <input
        type="text"
        className={ADMIN_INPUT}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      />
    )}
  </form.Field>
);

/**
 * The add row sits in a `.form-inline`, the edit row does not, and Bootstrap 2
 * lays `.checkbox` out differently in each: 25px rows with the box beside the
 * text, against 30px rows with the box outdented into the label's padding. Only
 * the add row offers "Select All".
 */
export const AllocationTypeCheckboxes = ({
  form,
  types,
  idPrefix,
  inline = false,
  selectAll = false,
}: {
  form: AppForm<KeywordFormValues>;
  types: AllocationType[];
  idPrefix: string;
  inline?: boolean;
  selectAll?: boolean;
}) => (
  <form.Field name="allocationTypeIds">
    {(field) => {
      const selectAllRow = {
        id: `${idPrefix}-select-all`,
        label: "Select All",
        checked: field.state.value.length === types.length,
        toggle: () =>
          field.handleChange(
            field.state.value.length === types.length
              ? []
              : types.map((t) => t.allocation_type_id),
          ),
      };

      const rows = [
        ...(selectAll ? [selectAllRow] : []),
        ...types.map((type) => ({
          id: `${idPrefix}-${type.allocation_type_id}`,
          label: type.display_allocation_type,
          checked: field.state.value.includes(type.allocation_type_id),
          toggle: () =>
            field.handleChange(
              field.state.value.includes(type.allocation_type_id)
                ? field.state.value.filter(
                    (id) => id !== type.allocation_type_id,
                  )
                : [...field.state.value, type.allocation_type_id],
            ),
        })),
      ];

      return rows.map((row) => (
        <div key={row.id}>
          <label
            htmlFor={row.id}
            className={cn(
              inline ? ADMIN_CHECKBOX_LABEL_INLINE : ADMIN_CHECKBOX_LABEL,
            )}
          >
            <input
              type="checkbox"
              id={row.id}
              className={cn(inline ? ADMIN_CHECKBOX_INLINE : ADMIN_CHECKBOX)}
              checked={row.checked}
              onChange={row.toggle}
            />
            {row.label}
          </label>
        </div>
      ));
    }}
  </form.Field>
);
