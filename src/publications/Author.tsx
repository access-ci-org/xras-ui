import { useSetAtom } from "jotai";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAuthorAtom, updateAuthorAtom } from "./atoms";
import type { PublicationAuthor } from "./types";

const FIELDS = ["first_name", "last_name", "affiliation"] as const;

export default function Author({
  author,
  authorKey,
}: {
  author: PublicationAuthor;
  authorKey: number;
}) {
  const updateAuthor = useSetAtom(updateAuthorAtom);
  const deleteAuthor = useSetAtom(deleteAuthorAtom);

  return (
    <tr>
      {FIELDS.map((key) => (
        <td key={key}>
          <Input
            name={key}
            id={key}
            value={author[key] ?? ""}
            onChange={(e) => updateAuthor({ idx: authorKey, key, value: e.target.value })}
          />
        </td>
      ))}
      <td>
        {authorKey !== 0 && (
          <Button variant="destructive" size="sm" onClick={() => deleteAuthor(authorKey)}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}
