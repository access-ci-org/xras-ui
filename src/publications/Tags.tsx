import { useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Select from "react-select";
import { publicationTagsAtom, updateTagsAtom } from "./atoms";
import type { TagCategory, TagOption } from "./types";

export default function Tags({ category, index }: { category: TagCategory; index: number }) {
  const publicationTags = useAtomValue(publicationTagsAtom);
  const updateTags = useSetAtom(updateTagsAtom);
  const ref = useRef(null);

  const defaultSelected = () => {
    const selected = publicationTags.find((pt) => pt.label === category.label);
    return selected ? selected.options : [];
  };

  return (
    <div>
      <div className="mb-1 font-bold">{category.label}</div>
      <div className="mb-3">
        <Select
          classNames={{
            control: (state) => (state.isFocused ? "custom-select-selected" : "border-grey-300"),
          }}
          defaultValue={defaultSelected()}
          options={category.options}
          isMulti
          openMenuOnClick
          name={`tags_${index}`}
          inputId={`tags_${index}`}
          ref={ref}
          closeMenuOnSelect={false}
          onChange={(tags) => updateTags({ category: category.label, tags: tags as TagOption[] })}
        />
      </div>
    </div>
  );
}
