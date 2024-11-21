import { useLayoutEffect, useRef } from "react";
import gridStyle from "./Grid.module.scss";
import { SelectInput } from "../shared/SelectInput/SelectInput";
import TextInput from "./Form/TextInput";
import GridText from "./GridText";
import Tooltip from "./ToolTip";

const handleChange = (row, column, value) => {
  // check if column has onChange handler
  if (column.onChange) {
    column.onChange(value, row);
    return;
  }

  // Fallback to cell-level onChange handlere
  const cellData = row[column.key];
  if (cellData?.onChange) {
    cellData.onChange(value);
  }
};

const columnTypeComponents = {
  text: GridText,
  select: ({ column, row, style }) => (
    <td style={style}>
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
    <td style={style}>
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
    <td style={style}>
      <input
        type="checkbox"
        checked={row[column.key].checked}
        onChange={(e) => handleChange(row, column, e.target.checked)}
      />
    </td>
  ),
  date: ({ column, row, style }) => {
    const cellData = row[column.key];
    if (!cellData?.value) return <td style={style}>{cellData || ""}</td>;

    return (
      <td style={style}>
        <input
          type="date"
          value={cellData.value}
          disabled={row[column.key].disabled}
          onChange={(e) => handleChange(row, column, e.target.value)}
          style={{ width: "92%", margin: 0 }}
          className="form-control"
        />
      </td>
    );
  },
  action: ({ column, row, style }) => {
    return (
      <td style={style}>
        {row.rate_type === "Discount" && (
          <button
            className="btn btn-link text-danger"
            onClick={() => handleChange(row, column, row[column.key]?.id)}
          >
            <i className="fa fa-trash"></i>
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
  scrollBehavior = "smooth",
  scrollRowIndex = 0,
}) {
  const container = useRef();
  useLayoutEffect(() => {
    if (!container.current) return;
    const row = container.current.querySelector(
      `tbody tr:nth-child(${scrollRowIndex + 1})`
    );
    if (row)
      row.scrollIntoView({
        behavior: scrollBehavior,
        block: "nearest",
        inline: "nearest",
      });
  }, [scrollRowIndex, scrollBehavior]);

  const columnLeft = [0];
  for (let i = 0; i < frozenColumns; i++)
    columnLeft[i + 1] = columnLeft[i] + (columns[i].width || 100);

  const getStyle = (i, zIndex) =>
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
      className={column.headerClass || column.class || ""}
      style={getStyle(i, 100)}
    >
      {column.formatHeader
        ? column.formatHeader(column.name, column)
        : column.name}
      {column.tooltip && (
        <Tooltip title={column.tooltip} placement="bottom">
          <i className="icon-info-sign"></i>
        </Tooltip>
      )}
    </th>
  ));

  const tr = rows.map((row, i) => {
    const td = columns.map((column, c) => {
      const Cell = columnTypeComponents[column.type || "text"];
      return (
        <Cell key={column.key} column={column} row={row} style={getStyle(c)} />
      );
    });
    return (
      <tr key={i} className={rowClasses[i] || ""}>
        {td}
      </tr>
    );
  });

  const style = {};
  if (minWidth) style.minWidth = minWidth;

  return (
    <div className={`${gridStyle.grid} ${classes || ""}`} ref={container}>
      <table className="table table-bordered" style={style}>
        <thead>
          <tr>{th}</tr>
        </thead>
        <tbody>{tr}</tbody>
      </table>
    </div>
  );
}
