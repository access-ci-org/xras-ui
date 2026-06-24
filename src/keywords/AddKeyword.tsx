import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AllocationTypeCheckbox from "./AllocationTypeCheckbox";
import type { AllocationType } from "./types";

type AddKeywordProps = {
  types: AllocationType[];
  createData: (keywordValues: string, keywordTypes: number[]) => Promise<void>;
};

const AddKeyword = ({ types, createData }: AddKeywordProps) => {
  const [keywordValues, setKeywordValues] = useState("");
  const [keywordTypes, setKeywordTypes] = useState<number[]>([]);

  const handleCreateKeyword = async () => {
    await createData(keywordValues, keywordTypes);
    setKeywordValues("");
    setKeywordTypes([]);
  };

  function updateKeywordAllocationTypes(allocationTypeId: number) {
    setKeywordTypes((current) =>
      current.includes(allocationTypeId)
        ? current.filter((id) => id !== allocationTypeId)
        : [...current, allocationTypeId],
    );
  }

  function toggleSelectAllAllocationTypes() {
    setKeywordTypes((current) =>
      current.length === types.length
        ? []
        : types.map((t) => t.allocation_type_id),
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="p-2 text-left">Keyword</th>
          <th className="p-2 text-left">Allocation Type</th>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="w-[150px] p-2 align-top">
            <Input
              type="text"
              value={keywordValues}
              onChange={(e) => setKeywordValues(e.target.value)}
            />
          </td>
          <td className="p-2 align-top">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-checkbox"
                  checked={keywordTypes.length === types.length}
                  onCheckedChange={toggleSelectAllAllocationTypes}
                />
                <Label htmlFor="select-all-checkbox" className="font-normal">
                  Select All
                </Label>
              </div>
              {types.map((type) => (
                <AllocationTypeCheckbox
                  key={`create_keyword_alloc_t_${type.allocation_type_id}`}
                  id={`id_create_alloc_type_${type.allocation_type_id}`}
                  type={type}
                  checked={keywordTypes.includes(type.allocation_type_id)}
                  onChange={updateKeywordAllocationTypes}
                />
              ))}
            </div>
          </td>
          <td className="w-[50px] p-2 align-top">
            <Button type="button" onClick={handleCreateKeyword}>
              Add
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default AddKeyword;
