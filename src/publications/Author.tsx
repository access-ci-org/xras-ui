import { Trash2 } from "lucide-react";
import type { AppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
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
        <td key={key}>
          <form.AppField name={`authors[${index}].${key}`}>
            {(field) => <field.FieldInput />}
          </form.AppField>
        </td>
      ))}
      <td>
        {showRemove && (
          <Button variant="destructive" size="sm" type="button" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}
