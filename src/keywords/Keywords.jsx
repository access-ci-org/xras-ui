import React, { useEffect, useState } from "react";
import Alert from "../shared/Alert.jsx";
import AddKeyword from "./AddKeyword.jsx";
import Keyword from "./Keyword.jsx";

export default function Keywords ({ allocationTypes }) {
  const [keywords, setKeywords] = useState([]);
  const [types, setTypes] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [validStatus, setValidStatus] = useState(true);

  const handleResponse = async (res) => {
      const jsonResponse = await res.json()
      const message = jsonResponse['message'] ?? 'Error: Changes not saved';

      if(res.ok) await readKeywords();

      setStatusMessage(message);
      setValidStatus(res.ok);
  }

  const createKeyword = async (keywordValues, keywordTypes) => {
      const res = await fetch(`/keywords`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
                  .content,
          },
          body: JSON.stringify({
              value: keywordValues,
              allocation_types: keywordTypes
          }),
      });
      await handleResponse(res);
  }

  const readKeywords = async () => {
    if(types.length === 0) setTypes(allocationTypes) 
    
    const res = await fetch(`/keywords`,
    {headers:{
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        });
    const result = await res.json();
    setKeywords(result);
  }

  const updateKeyword = async (id, keyword, allocationTypes)  => {
    const res = await fetch(`/keywords/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
                .content,
        },
        body: JSON.stringify({
            id: id,
            keyword: keyword,
            allocation_types: allocationTypes
        }),
    })
    await handleResponse(res);
  };

  const deleteKeyword = async (id) => {
      const res = await fetch(`/keywords/${id}`, {
          headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]')
                  .content,
          },
          method: "DELETE"
      });
      await handleResponse(res);
  }

  useEffect(() => {
    readKeywords();
  }, [])
    let keywordStatusMessage = null;
    if(statusMessage.length !== 0) {
        keywordStatusMessage = (
            <Alert color={validStatus ? "success" : "warning"}>{statusMessage}</Alert>
        )
    }
  return (
    <>
        <p>
          Type new keywords separated by semicolons, select the desired allocation types, and then submit.
        </p>
        <>{keywordStatusMessage}</>
        <AddKeyword
          key = {"add-keywords"}
          types = {types}
          createData={createKeyword}
        />
        <h3>Current Keywords</h3>
        <table className={'table table-bordered'}>
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Allocation Types</th>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {keywords.map(k =>
                <Keyword
                  key = {k.keyword_id}
                  keyword={k}
                  keywordAllocationTypeIds={k.allocation_type_keywords.map(kat => kat.allocation_type_id)}
                  types={types}
                  saveData={updateKeyword}
                  deleteData={deleteKeyword}
                />
              )}
            </tbody>
        </table>
    </>
  )
}

