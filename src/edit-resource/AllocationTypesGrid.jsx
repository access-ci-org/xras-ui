import React from 'react';
import PropTypes from 'prop-types';
import Grid from '../shared/Grid';
import style from './AllocationTypesGrid.module.scss';

export const AllocationGrid = React.memo(({ columns, rows, onAddRequiredResource }) => (
    <div className={style["mb-2"]}>
      <h2>Allocation Types</h2>
      <div className={style["allocationTypesHeader"]}>
        <button className='btn btn-primary' onClick={onAddRequiredResource}>
          Add Required Resource
        </button>
      </div>
      <Grid
        classes={style["no-scroll-grid"]}
        columns={columns}
        rows={rows}
      />
    </div>
  ));
  
  AllocationGrid.propTypes = {
    columns: PropTypes.array.isRequired,
    rows: PropTypes.array.isRequired,
    onAddRequiredResource: PropTypes.func.isRequired,
  };