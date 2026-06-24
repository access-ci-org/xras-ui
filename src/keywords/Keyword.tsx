import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AllocationTypeCheckbox from "./AllocationTypeCheckbox";
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
  const [updatedKeyword, setUpdatedKeyword] = useState(keyword.keyword);
  const [updatedAllocationTypes, setUpdatedAllocationTypes] = useState(
    keywordAllocationTypeIds,
  );

  const handleSaveData = () => {
    setIsEditing(false);
    saveData(keyword.keyword_id, updatedKeyword, updatedAllocationTypes);
  };

  const updateAllocationTypes = (allocationTypeId: number) => {
    setUpdatedAllocationTypes((current) =>
      current.includes(allocationTypeId)
        ? current.filter((id) => id !== allocationTypeId)
        : [...current, allocationTypeId],
    );
  };

  const allocationTypeDisplay = isEditing
    ? types.map((type) => (
        <AllocationTypeCheckbox
          key={`keyword_${keyword.keyword}_alloc_t_${type.allocation_type_id}`}
          checked={updatedAllocationTypes.includes(type.allocation_type_id)}
          id={`keyword_${keyword.keyword}_alloc_type_${type.allocation_type_id}`}
          onChange={updateAllocationTypes}
          type={type}
        />
      ))
    : types
        .filter((type) =>
          keywordAllocationTypeIds.includes(type.allocation_type_id),
        )
        .map((type) => type.display_allocation_type)
        .join(", ");

  return (
    <tr className="border-b">
      <td className="p-2 align-top">
        {isEditing ? (
          <Input
            type="text"
            value={updatedKeyword}
            onChange={(e) => setUpdatedKeyword(e.target.value)}
          />
        ) : (
          keyword.keyword
        )}
      </td>
      <td className="p-2 align-top">
        <div className="flex flex-wrap items-center gap-4">
          {allocationTypeDisplay}
        </div>
      </td>
      <td className="w-[150px] p-2 align-top">
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveData}>
              Save
            </Button>
          </div>
        ) : (
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
        )}
      </td>
    </tr>
  );
};

export default Keyword;
