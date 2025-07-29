import React, { useState } from "react";
import AllocationTypeCheckBox from "./AllocationTypeCheckbox";

const Keyword = ({ keyword, keywordAllocationTypeIds, types, saveData, deleteData  }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedKeyword, setUpdatedKeyword] = useState(keyword.keyword);
  const [updatedAllocationTypes, setUpdatedAllocationTypes] = useState(keywordAllocationTypeIds);

  const handleSaveData = () => {
      setIsEditing(false);
      saveData(keyword.keyword_id, updatedKeyword, updatedAllocationTypes);
  }

  const updateAllocationTypes = (allocationTypeId) => {
    let updatedAllocationTypesRef= updatedAllocationTypes;
    if (updatedAllocationTypesRef.includes(allocationTypeId)) {
        updatedAllocationTypesRef = updatedAllocationTypesRef.filter(e => e !== allocationTypeId);
    } else {
        updatedAllocationTypesRef = [...updatedAllocationTypesRef, allocationTypeId];
    }
    setUpdatedAllocationTypes(updatedAllocationTypesRef);
  }

  let allocationTypeDisplay = ''
  let keywordText = keyword.keyword.toString();

  if (!isEditing) {
    allocationTypeDisplay = types.filter(type => keywordAllocationTypeIds.includes(type.allocation_type_id))
    .map(type => type.display_allocation_type)
    .join(", ");
  }
  else {
    keywordText =
    <input
      type="text"
      id={keyword.keyword_id}
      value={updatedKeyword}
      onChange={keyword => setUpdatedKeyword(keyword.target.value)}
    />
    allocationTypeDisplay = types.map(type =>
        <AllocationTypeCheckBox
            key={`keyword_${keyword.keyword}_alloc_t_${type.allocation_type_id}`}
            checked={updatedAllocationTypes.includes(type.allocation_type_id)}
            id={`keyword_${keyword.keyword}_alloc_type_${type.allocation_type_id}`}
            onChange={updateAllocationTypes}
            type={type} />
    );
  }

  return (
    <tr>
      <td> {keywordText} </td>
      <td> {allocationTypeDisplay} </td>
      {isEditing ?
        <td style={{ width: "150px" }}>
          <button style={{ marginRight: "5px" }} className={'btn btn-warning btn-sm'} onClick={() => setIsEditing(false)}>Cancel</button>
          <button className={'btn btn-success btn-sm'} onClick={async () => {handleSaveData()}}>Save</button>
        </td>
      :
        <td style={{ width: "150px" }}>
          <button style={{ marginRight: "5px" }} className={'btn btn-primary btn-sm'} onClick={() => setIsEditing(true)}>Edit</button>
          <button className={'btn btn-danger btn-sm'} onClick={async () => deleteData(keyword.keyword_id)}>Delete</button>
        </td>
      }
    </tr>
  )
}

export default Keyword;