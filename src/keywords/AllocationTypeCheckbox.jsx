import React from "react";

const AllocationTypeCheckBox = ({id, type, checked, onChange}) => {
    return (
      <div className="control-group" style={{ marginBottom: "0px" }}>
        <div className="controls">
          <label htmlFor={id} className="checkbox">
            <input
              onChange={() => onChange(type.allocation_type_id)}
              type="checkbox"
              checked={checked}
              id={id}
            />
            {type.display_allocation_type}
          </label>
        </div>
      </div>
    )
}

export default AllocationTypeCheckBox;