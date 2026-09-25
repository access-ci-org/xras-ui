import { cn } from "@/lib/utils";
import { cellClasses, type GridColumn, type GridRow } from "./Grid";

export default function GridText({
  column,
  row,
  style = {},
}: {
  column: GridColumn;
  row: GridRow;
  style?: React.CSSProperties;
}) {
  const value = column.format ? column.format(row[column.key], row) : row[column.key];

  return (
    <td className={cn(cellClasses, column.class, column.rowClass?.(row))} style={style}>
      {value}
    </td>
  );
}
