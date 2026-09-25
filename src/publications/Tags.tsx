import Select from "react-select";
import type { AppForm } from "@/components/form";
import type { PublicationFormValues } from "./PublicationForm";
import type { TagCategory, TagOption } from "./types";

export default function Tags({
  form,
  category,
  index,
}: {
  form: AppForm<PublicationFormValues>;
  category: TagCategory;
  index: number;
}) {
  return (
    <div>
      <div className="mb-1 font-bold">{category.label}</div>
      <div className="mb-3">
        <form.Field name="tags">
          {(field) => {
            const selected = field.state.value.find((t) => t.label === category.label)?.options ?? [];

            return (
              <Select
                classNames={{
                  control: (state) => (state.isFocused ? "custom-select-selected" : "border-grey-300"),
                }}
                value={selected}
                options={category.options}
                isMulti
                openMenuOnClick
                name={`tags_${index}`}
                inputId={`tags_${index}`}
                closeMenuOnSelect={false}
                onChange={(tags) => {
                  const otherTags = field.state.value.filter((t) => t.label !== category.label);
                  field.handleChange([
                    ...otherTags,
                    { label: category.label, options: tags as TagOption[] },
                  ]);
                }}
              />
            );
          }}
        </form.Field>
      </div>
    </div>
  );
}
