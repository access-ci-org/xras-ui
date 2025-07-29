import React, { useState } from "react";
import AllocationTypeCheckBox from "./AllocationTypeCheckbox";


const AddKeyword = ({types, createData}) => {
    const [keywordValues, setKeywordValues] = useState("");
    const [keywordTypes, setKeywordTypes] = useState([]);

    const handleCreateKeyword = async (keywordValues, keywordTypes)  => {
        createData(keywordValues, keywordTypes);
        setKeywordValues("");
        setKeywordTypes([]);

    };

    function updateKeywordAllocationTypes(allocationTypeId) {
        let updatedKeywordTypesRef= keywordTypes;
        if (updatedKeywordTypesRef.includes(allocationTypeId)) {
            updatedKeywordTypesRef = updatedKeywordTypesRef.filter(e => e !== allocationTypeId);
        } else {
            updatedKeywordTypesRef = [...updatedKeywordTypesRef, allocationTypeId];
        }
        setKeywordTypes(updatedKeywordTypesRef);
    }

    function toggleSelectAllAllocationTypes() {
        let updatedKeywordTypesRef = keywordTypes;
        setKeywordTypes(updatedKeywordTypesRef.length===types.length ? [] : [...types.map((t) => t.allocation_type_id)]);
    }

    return (
      <table className="table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Allocation Type</th>
            <td></td>
          </tr>
        </thead>
        <tbody>
        <tr>
          <td style={{ width: "150px" }}>
            <input
              type="text"
              value={keywordValues}
              className="form-control"
              onChange={keyword => setKeywordValues(keyword.target.value)}/>
          </td>
          <td>
            <div className="form-inline">
              <div className="control-group" style={{ marginBottom: "0px" }}>
                <div className="controls">
                  <label htmlFor={'select-all-checkbox'} className="checkbox">
                    <input
                      onChange={() => toggleSelectAllAllocationTypes()}
                      type="checkbox"
                      checked={keywordTypes.length === types.length}
                      id={'select-all-checkbox'}
                    />
                    Select All
                  </label>
                </div>
              </div>
              {types.map(type =>
                <AllocationTypeCheckBox
                    key={`create_keyword_alloc_t_${type.allocation_type_id}`}
                    id={`id_create_alloc_type_${type.allocation_type_id}`}
                    type={type}
                    checked={keywordTypes.includes(type.allocation_type_id)}
                    onChange={updateKeywordAllocationTypes}
                />
              )}
            </div>
          </td>
          <td style={{ width: "50px" }}>
            <button
                className="btn btn-primary"
                type="button"
                onClick={async () => handleCreateKeyword(keywordValues, keywordTypes)}
            >
                Add
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    )
}

export default AddKeyword;