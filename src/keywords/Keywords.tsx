import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import AddKeyword from "./AddKeyword";
import Keyword from "./Keyword";
import type { AllocationType, Keyword as KeywordType } from "./types";

function csrfToken() {
  return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
    .content;
}

export default function Keywords({
  allocationTypes,
}: {
  allocationTypes: AllocationType[];
}) {
  const [keywords, setKeywords] = useState<KeywordType[]>([]);
  const [types, setTypes] = useState<AllocationType[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [validStatus, setValidStatus] = useState(true);

  const handleResponse = async (res: Response) => {
    const jsonResponse = await res.json();
    const message = jsonResponse["message"] ?? "Error: Changes not saved";

    if (res.ok) await readKeywords();

    setStatusMessage(message);
    setValidStatus(res.ok);
  };

  const createKeyword = async (keywordValues: string, keywordTypes: number[]) => {
    const res = await fetch(`/keywords`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({
        value: keywordValues,
        allocation_types: keywordTypes,
      }),
    });
    await handleResponse(res);
  };

  const readKeywords = async () => {
    if (types.length === 0) setTypes(allocationTypes);

    const res = await fetch(`/keywords`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const result = await res.json();
    setKeywords(result);
  };

  const updateKeyword = async (
    id: number,
    keyword: string,
    allocationTypes: number[],
  ) => {
    const res = await fetch(`/keywords/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({
        id: id,
        keyword: keyword,
        allocation_types: allocationTypes,
      }),
    });
    await handleResponse(res);
  };

  const deleteKeyword = async (id: number) => {
    const res = await fetch(`/keywords/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      method: "DELETE",
    });
    await handleResponse(res);
  };

  useEffect(() => {
    readKeywords();
  }, []);

  return (
    <>
      <p>
        Type new keywords separated by semicolons, select the desired
        allocation types, and then submit.
      </p>
      {statusMessage.length !== 0 && (
        <div
          role="alert"
          className={cn(
            "mt-3 rounded-none border p-3",
            validStatus
              ? "border-green-600 bg-green-50 text-green-800"
              : "border-yellow-600 bg-yellow-50 text-yellow-800",
          )}
        >
          {statusMessage}
        </div>
      )}
      <AddKeyword key="add-keywords" types={types} createData={createKeyword} />
      <h3>Current Keywords</h3>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Keyword</th>
            <th className="p-2 text-left">Allocation Types</th>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {keywords.map((k) => (
            <Keyword
              key={k.keyword_id}
              keyword={k}
              keywordAllocationTypeIds={k.allocation_type_keywords.map(
                (kat) => kat.allocation_type_id,
              )}
              types={types}
              saveData={updateKeyword}
              deleteData={deleteKeyword}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}
