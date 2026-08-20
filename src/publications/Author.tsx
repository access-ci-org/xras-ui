import { Trash2 } from "lucide-react";
import type { AppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicationFormValues } from "./PublicationForm";

const FIELDS = ["first_name", "last_name", "affiliation"] as const;

export default function Author({
  form,
  index,
  showRemove,
  onRemove,
}: {
  form: AppForm<PublicationFormValues>;
  index: number;
  showRemove: boolean;
  onRemove: () => void;
}) {
  return (
    <tr>
      {FIELDS.map((key) => (
        <td key={key} className="border-b p-2">
          <form.Field name={`authors[${index}].${key}`}>
            {(field) => (
              <Input
                id={`authors_${index}_${key}`}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            )}
          </form.Field>
        </td>
      ))}
      <td className="border-b p-2">
        {showRemove && (
          <Button variant="destructive" size="sm" type="button" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}
