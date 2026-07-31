import { useState } from "react";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
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
          await saveData(keyword.keyword_id, updatedKeyword, updatedAllocationTypes);
        }}
      />
    );
  }

  return (
    <tr className="border-b">
      <td className="p-2 align-top">{keyword.keyword}</td>
      <td className="p-2 align-top">
        <div className="flex flex-wrap items-center gap-4">
          {types
            .filter((type) => keywordAllocationTypeIds.includes(type.allocation_type_id))
            .map((type) => type.display_allocation_type)
            .join(", ")}
        </div>
      </td>
      <td className="w-[150px] p-2 align-top">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteData(keyword.keyword_id)}
          >
            Delete
          </Button>
        </div>
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
    <tr className="border-b">
      <td className="p-2 align-top">
        <KeywordInputField form={form} />
      </td>
      <td className="p-2 align-top">
        <AllocationTypeCheckboxes
          form={form}
          types={types}
          idPrefix={`keyword_${keyword.keyword_id}`}
        />
      </td>
      <td className="w-[150px] p-2 align-top">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => form.handleSubmit()}>
            Save
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default Keyword;
