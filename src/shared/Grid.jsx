import { useLayoutEffect, useRef } from "react";
import gridStyle from "./Grid.module.scss";

import GridText from "./GridText";

const columnTypeComponents = {
  text: GridText,
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
