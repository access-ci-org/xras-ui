import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import Alert from "../shared/Alert";
import Author from "./Author";
import { addAuthorAtom, authorsAtom, authorsExistAtom } from "./atoms";

export default function Authors() {
  const authors = useAtomValue(authorsAtom);
  const authorsExist = useAtomValue(authorsExistAtom);
  const addAuthor = useSetAtom(addAuthorAtom);

  const noAuthors = authors.length === 0;

  useEffect(() => {
    if (noAuthors) addAuthor();
  }, [noAuthors, addAuthor]);

  return (
    <div>
      {!authorsExist && (
        <Alert color="danger">
          You must add at least one author and each author must have a first and last name
        </Alert>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="p-2">First Name</th>
            <th className="p-2">Last Name</th>
            <th className="p-2">Affiliation</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {authors.map((a, i) => (
            <Author author={a} authorKey={i} key={i} />
          ))}
        </tbody>
      </table>
      <Button className="mt-3" onClick={() => addAuthor()}>
        Add Author
      </Button>
    </div>
  );
}
