import { useState } from "react";
import { useAppForm } from "@/components/form";
import {
  ADMIN_BTN_DANGER,
  ADMIN_BTN_GAP,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SUCCESS,
  ADMIN_BTN_WARNING,
  ADMIN_TD,
} from "../shared/adminTheme";
import { cn } from "@/lib/utils";
import { AllocationTypeCheckboxes, KeywordInputField } from "./KeywordFields";
import type { AllocationType, Keyword as KeywordType } from "./types";

type KeywordProps = {
  keyword: KeywordType;
  keywordAllocationTypeIds: number[];
  types: AllocationType[];
  saveData: (
    id: number,
    keyword: string,
    allocationTypes: number[],
  ) => Promise<void>;
  deleteData: (id: number) => Promise<void>;
};

const Keyword = ({
  keyword,
  keywordAllocationTypeIds,
  types,
  saveData,
  deleteData,
}: KeywordProps) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <KeywordEditRow
        keyword={keyword}
        keywordAllocationTypeIds={keywordAllocationTypeIds}
        types={types}
        onCancel={() => setIsEditing(false)}
        onSave={async (updatedKeyword, updatedAllocationTypes) => {
          setIsEditing(false);
          await saveData(
            keyword.keyword_id,
            updatedKeyword,
            updatedAllocationTypes,
          );
        }}
      />
    );
  }

  return (
    <tr>
      <td className={ADMIN_TD}>{keyword.keyword}</td>
      <td className={ADMIN_TD}>
        {types
          .filter((type) =>
            keywordAllocationTypeIds.includes(type.allocation_type_id),
          )
          .map((type) => type.display_allocation_type)
          .join(", ")}
      </td>
      <td className={cn("box-content w-[150px]", ADMIN_TD)}>
        <button
          type="button"
          className={cn(ADMIN_BTN_PRIMARY, ADMIN_BTN_GAP)}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className={ADMIN_BTN_DANGER}
          onClick={() => deleteData(keyword.keyword_id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

const KeywordEditRow = ({
  keyword,
  keywordAllocationTypeIds,
  types,
  onCancel,
  onSave,
}: {
  keyword: KeywordType;
  keywordAllocationTypeIds: number[];
  types: AllocationType[];
  onCancel: () => void;
  onSave: (keyword: string, allocationTypeIds: number[]) => Promise<void>;
}) => {
  const form = useAppForm({
    defaultValues: {
      keyword: keyword.keyword,
      allocationTypeIds: keywordAllocationTypeIds,
    },
    onSubmit: async ({ value }) => {
      await onSave(value.keyword, value.allocationTypeIds);
    },
  });

  return (
    <tr>
      <td className={ADMIN_TD}>
        <KeywordInputField form={form} />
      </td>
      <td className={ADMIN_TD}>
        <AllocationTypeCheckboxes
          form={form}
          types={types}
          idPrefix={`keyword_${keyword.keyword_id}`}
        />
      </td>
      <td className={cn("box-content w-[150px]", ADMIN_TD)}>
        <button
          type="button"
          className={cn(ADMIN_BTN_WARNING, ADMIN_BTN_GAP)}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={ADMIN_BTN_SUCCESS}
          onClick={() => form.handleSubmit()}
        >
          Save
        </button>
      </td>
    </tr>
  );
};

export default Keyword;
