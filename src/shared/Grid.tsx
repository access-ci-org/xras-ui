import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Info, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import gridStyle from "./Grid.module.scss";
import { SelectInput } from "./SelectInput/SelectInput";
import TextInput from "./Form/TextInput";
import GridText from "./GridText";
import DatePicker from "./DatePicker/DatePicker";

export type GridRow = Record<string, any>;

export type GridColumn = {
  key: string;
  name?: ReactNode;
  width?: number;
  type?: "text" | "select" | "input" | "checkbox" | "date" | "action";
  class?: string;
  headerClass?: string;
  rowClass?: (row: GridRow) => string;
  format?: (value: any, row: GridRow) => ReactNode;
  formatHeader?: (name: ReactNode, column: GridColumn) => ReactNode;
  tooltip?: string;
  minDate?: string;
  maxDate?: string;
  onChange?: (value: any, row: GridRow) => void;
  /** Extra column-level metadata for custom format/formatHeader callbacks. */
  disabled?: boolean;
  icon?: string;
};

type CellProps = { column: GridColumn; row: GridRow; style: React.CSSProperties };

/** Matches the cell metrics of Bootstrap's `.table`. */
export const cellClasses = "p-2 align-top";

const handleChange = (row: GridRow, column: GridColumn, value: any) => {
  // check if column has onChange handler
  if (column.onChange) {
    column.onChange(value, row);
    return;
  }

  // Fallback to cell-level onChange handler
  const cellData = row[column.key];
  if (cellData?.onChange) {
    cellData.onChange(value);
  }
};

const columnTypeComponents: Record<string, (props: CellProps) => ReactNode> = {
  text: GridText,
  select: ({ column, row, style }) => (
    <td className={cellClasses} style={style}>
      <SelectInput
        label=""
        options={row[column.key].options}
        value={row[column.key].value}
        onChange={(e) => handleChange(row, column, e.target.value)}
        style={{ width: "100%", margin: 0 }}
      />
    </td>
  ),
  input: ({ column, row, style }) => (
    <td className={cellClasses} style={style}>
      <TextInput
        label=""
        type="text"
        disabled={row[column.key].disabled}
        value={row[column.key].value}
        onChange={(e) => handleChange(row, column, e.target.value)}
        style={{ width: "92%", margin: 0 }}
      />
    </td>
  ),
  checkbox: ({ column, row, style }) => (
    <td className={cellClasses} style={style}>
      <input
        className="size-4"
        type="checkbox"
        checked={row[column.key].checked}
        onChange={(e) => handleChange(row, column, e.target.checked)}
      />
    </td>
  ),
  date: ({ column, row, style }) => {
    const cellData = row[column.key];
    if (!cellData?.value && typeof cellData !== "object") {
      return (
        <td className={cellClasses} style={style}>
          {cellData || ""}
        </td>
      );
    }

    return (
      <td className={cellClasses} style={style}>
        <DatePicker
          value={cellData.value}
          onChange={(value) => handleChange(row, column, value)}
          disabled={cellData.disabled}
          style={{ width: "92%", margin: 0 }}
          minDate={column.minDate}
          maxDate={column.maxDate}
          error={cellData.error}
        />
      </td>
    );
  },
  action: ({ column, row, style }) => {
    return (
      <td className={cellClasses} style={style}>
        {row.rate_type === "Discount" && (
          <button
            className="text-destructive hover:text-destructive/80"
            onClick={() => handleChange(row, column, row[column.key]?.id)}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </td>
    );
  },
};

export default function Grid({
  columns,
  rows,
  classes,
  frozenColumns = 0,
  minWidth,
  rowClasses = [],
  scroll = true,
  scrollBehavior = "smooth",
  scrollRowIndex = 0,
}: {
  columns: GridColumn[];
  rows: GridRow[];
  classes?: string;
  frozenColumns?: number;
  minWidth?: string;
  rowClasses?: string[];
  scroll?: boolean;
  scrollBehavior?: ScrollBehavior;
  scrollRowIndex?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!scroll || !container.current) return;
    const row = container.current.querySelector(`tbody tr:nth-child(${scrollRowIndex + 1})`);
    if (row)
      row.scrollIntoView({
        behavior: scrollBehavior,
        block: "nearest",
        inline: "nearest",
      });
  }, [scroll, scrollRowIndex, scrollBehavior]);

  const columnLeft = [0];
  for (let i = 0; i < frozenColumns; i++)
    columnLeft[i + 1] = columnLeft[i] + (columns[i].width || 100);

  const getStyle = (i: number, zIndex?: number): React.CSSProperties =>
    i < frozenColumns
      ? {
          position: "sticky",
          left: `${columnLeft[i]}px`,
          minWidth: `${columns[i].width || 100}px`,
          width: `${columns[i].width || 100}px`,
          zIndex: zIndex || 1,
        }
      : {};

  const th = columns.map((column, i) => (
    <th
      key={column.key}
      className={cn("p-2 text-left align-bottom", column.headerClass || column.class)}
      style={getStyle(i, 100)}
    >
      {column.formatHeader ? column.formatHeader(column.name, column) : column.name}
      {column.tooltip && (
        <Tooltip>
          <TooltipTrigger className="ml-1 align-middle">
            <Info className="size-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>{column.tooltip}</TooltipContent>
        </Tooltip>
      )}
    </th>
  ));

  const tr = rows.map((row, i) => {
    const td = columns.map((column, c) => {
      const Cell = columnTypeComponents[column.type || "text"];
      return <Cell key={column.key} column={column} row={row} style={getStyle(c)} />;
    });
    return (
      <tr key={i} className={rowClasses[i] || ""}>
        {td}
      </tr>
    );
  });

  const style: React.CSSProperties = {};
  if (minWidth) style.minWidth = minWidth;

  return (
    <div
      className={cn(gridStyle.grid, scroll && gridStyle.scroll, "mb-4", classes)}
      ref={container}
    >
      <table className="w-full border-collapse" style={style}>
        <thead>
          <tr>{th}</tr>
        </thead>
        <tbody>{tr}</tbody>
      </table>
    </div>
  );
}
