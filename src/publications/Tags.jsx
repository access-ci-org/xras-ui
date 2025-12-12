import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getPublicationTags,
  updateSelectedTags,
} from "./helpers/publicationEditSlice";

import Select from "react-select";

export default function Tags({ category, index }) {
  const dispatch = useDispatch();
  const publicationTags = useSelector(getPublicationTags);
  const ref = useRef(null);

  const defaultSelected = () => {
    const selected = publicationTags.filter(
      (pt) => pt.label == category.label,
    )[0];
    if (selected) {
      return selected.options;
    }

    return [];
  };

  const updateTags = (tags) => {
    dispatch(updateSelectedTags({ category: category.label, tags: tags }));
  };

  return (
    <>
      <div className={"fw-bold mb-1"}>{category.label}</div>
      <div className={"mb-3"}>
        <Select
          classNames={{
            control: (state) =>
              state.isFocused ? "custom-select-selected" : "border-grey-300",
          }}
          defaultValue={defaultSelected()}
          options={category.options}
          isMulti
          openMenuOnClick={true}
          name={`tags_${index}`}
          inputId={`tags_${index}`}
          ref={ref}
          closeMenuOnSelect={false}
          onChange={updateTags}
        />
      </div>
    </>
  );
}
