import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AllocationType } from "./types";

type AllocationTypeCheckboxProps = {
  id: string;
  type: AllocationType;
  checked: boolean;
  onChange: (allocationTypeId: number) => void;
};

const AllocationTypeCheckbox = ({
  id,
  type,
  checked,
  onChange,
}: AllocationTypeCheckboxProps) => {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={() => onChange(type.allocation_type_id)}
      />
      <Label htmlFor={id} className="font-normal">
        {type.display_allocation_type}
      </Label>
    </div>
  );
};

export default AllocationTypeCheckbox;
