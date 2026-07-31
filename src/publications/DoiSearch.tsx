import { useAtomValue, useSetAtom } from "jotai";
import type { AppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import config from "../shared/helpers/config";
import { mergeFieldsForType, type PublicationFormValues } from "./PublicationForm";
import { addErrorAtom, publicationTypesAtom } from "./atoms";
import type { PublicationAuthor } from "./types";

const SKIPPED_KEYS = new Set(["fields", "projects", "publication_resources", "tags", "authors", "type"]);
const KNOWN_SCALAR_KEYS = ["title", "publication_year", "publication_month", "doi"] as const;

export default function DoiSearch({ form }: { form: AppForm<PublicationFormValues> }) {
  const publicationTypes = useAtomValue(publicationTypesAtom);
  const addError = useSetAtom(addErrorAtom);

  const doiLookup = async () => {
    const doi = form.getFieldValue("doi");
    const lookupError =
      "Unable to retrieve publication. Double check your DOI, or continue entering information manually.";

    try {
      const response = await fetch(config.routes.publications_lookup_path({ doi }));
      const data: Record<string, unknown> = await response.json();

      if (data.title === "") {
        addError(lookupError);
        return;
      }

      const pubType = publicationTypes.find((pt) => pt.citation_style_type === data.type);
      const newType = pubType ? pubType.publication_type : "Other";
      const mergedFields = mergeFieldsForType(newType, form.getFieldValue("fields"), publicationTypes);
      const fields = mergedFields.map((f) => ({
        ...f,
        field_value: (data[f.csl_field_name] as string | undefined) ?? "",
      }));

      form.setFieldValue("publication_type", newType);
      form.setFieldValue("fields", fields);

      if (Array.isArray(data.authors)) {
        form.setFieldValue(
          "authors",
          (data.authors as PublicationAuthor[]).map((author) => ({
            ...author,
            affiliation: author.affiliation ?? "",
          })),
        );
      }

      KNOWN_SCALAR_KEYS.forEach((key) => {
        if (data[key] != null) form.setFieldValue(key, data[key] as string);
      });

      const extraFields: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (SKIPPED_KEYS.has(key) || (KNOWN_SCALAR_KEYS as readonly string[]).includes(key)) return;
        if (value != null) extraFields[key] = value;
      });
      form.setFieldValue("extraFields", extraFields);
    } catch {
      addError(lookupError);
    }
  };

  return (
    <div className="mb-3">
      <Label htmlFor="doi">DOI</Label>
      <div className="flex gap-2">
        <form.AppField name="doi">
          {(field) => <field.FieldInput aria-label="DOI Input and Search box" />}
        </form.AppField>
        <Button type="button" onClick={() => void doiLookup()}>
          Lookup Publication
        </Button>
      </div>
    </div>
  );
}
