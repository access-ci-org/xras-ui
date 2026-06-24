import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Grid from "../shared/Grid";
import style from "./AllocationTypesGrid.module.scss";

export const AllocationGridHeader = ({
  onAddAllocationType,
  onAddRequiredResource,
}: {
  onAddAllocationType: () => void;
  onAddRequiredResource: () => void;
}) => (
  <div className={style["header-buttons"]}>
    <Button onClick={onAddAllocationType}>
      <Plus className="size-4" /> Add Allocation Type
    </Button>
    <Button onClick={onAddRequiredResource}>
      <Plus className="size-4" /> Add Required Resource
    </Button>
  </div>
);

export const AllocationGrid = memo(function AllocationGrid({
  columns,
  rows,
}: {
  columns: any[];
  rows: any[];
}) {
  return (
    <div className={style["allocation-types-grid"]}>
      <Grid
        columns={columns}
        rows={rows}
        rowClasses={Array(rows.length).fill(style["vertical-align-center"])}
        scroll={false}
      />
      <p
        style={{
          margin: "0",
          fontStyle: "italic",
          fontWeight: "bold",
        }}
      >
        Note: You may need to contact your Allocations Coordinator if you have added this resource
        to an allocation type.
      </p>
    </div>
  );
});
