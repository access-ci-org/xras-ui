import React from "react";
import PropTypes from "prop-types";
import Grid from "../shared/Grid";
import style from "./AllocationTypesGrid.module.scss";

export const AllocationGridHeader = ({
  onAddAllocationType,
  onAddRequiredResource,
}) => (
  <div className={style["header-buttons"]}>
    <button className="btn btn-primary" onClick={onAddAllocationType}>
      <i className="fa fa-plus"></i> Add Allocation Type
    </button>
    <button className="btn btn-primary" onClick={onAddRequiredResource}>
      <i className="fa fa-plus"></i> Add Required Resource
    </button>
  </div>
);

AllocationGridHeader.propTypes = {
  headerText: PropTypes.node,
  onAddAllocationType: PropTypes.func.isRequired,
  onAddRequiredResource: PropTypes.func.isRequired,
};

export const AllocationGrid = React.memo(function AllocationGrid({
  columns,
  rows,
}) {
  return (
    <div className={style["allocation-types-grid"]}>
      <Grid
        columns={columns}
        rows={rows}
        rowClasses={Array(rows.length).fill(style["vertical-align-center"])}
        scroll={false}
      />
    </div>
  );
});

AllocationGrid.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
};
