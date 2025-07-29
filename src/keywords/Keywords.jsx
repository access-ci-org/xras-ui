import React, { useEffect, useState } from "react";

const Keyword = ({ keyword }) => {
  const [isEditing, setIsEditing] = useState(false);


  return (
    <tr>
      <td>
        {keyword.keyword}
      </td>
      <td>

        {!isEditing ? keyword.allocationType : 'something'}
      </td>
      <td>
        <button onClick={setIsEditing(true)}>Edit</button>
        <button>Delete</button>
      </td>
    </tr>
  )
}

const Keywords = () => {
  const [keywords, setKeywords] = useState([]); // From the back end
  const [allocationsTypes, setAllocationTypes] = useState([]); // From the back end
  
  const loadData = async () => {
    const response = await fetch('/fooo');
    setKeywords(response.data.keywords);
    setAllocationTypes(response.data.allocationTypes)
    /*
      {keywords: [], allocationTypes: []}
    */
  }

  const saveData = async () => {

  }

  useEffect(() => {
    loadData();
  }, [])

  return <>
    {keywords.map((k) => <Keyword keyword={k} saveData={saveData} />)}
  </>
}

export default Keywords;