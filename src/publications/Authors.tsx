import type { AppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import Alert from "../shared/Alert";
import Author from "./Author";
import type { PublicationFormValues } from "./PublicationForm";
import type { PublicationAuthor } from "./types";

function emptyAuthor(): PublicationAuthor {
  return {
    portal_username: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    prefix: "",
    suffix: "",
    initials: "",
    affiliation: "",
    hash: {},
  };
}

export default function Authors({ form }: { form: AppForm<PublicationFormValues> }) {
  return (
    <form.Field name="authors" mode="array">
      {(authorsField) => {
        const authors = authorsField.state.value;
        const authorsExist =
          authors.length > 0 && authors.every((a) => a.first_name !== "" && a.last_name !== "");

        return (
          <div>
            {!authorsExist && (
              <Alert className="mt-0" color="danger">
                You must add at least one author and each author must have a first and last name
              </Alert>
            )}
            <table className="mb-4 w-full">
              <thead>
                <tr>
                  <th className="border-b p-2 text-left font-bold text-black">First Name</th>
                  <th className="border-b p-2 text-left font-bold text-black">Last Name</th>
                  <th className="border-b p-2 text-left font-bold text-black">Affiliation</th>
                  <th className="border-b p-2"></th>
                </tr>
              </thead>
              <tbody>
                {authors.map((_, i) => (
                  <Author
                    key={i}
                    form={form}
                    index={i}
                    showRemove={i !== 0}
                    onRemove={() => authorsField.removeValue(i)}
                  />
                ))}
              </tbody>
            </table>
            <Button
              type="button"
              className="mt-4"
              onClick={() => authorsField.pushValue(emptyAuthor())}
            >
              Add Author
            </Button>
          </div>
        );
      }}
    </form.Field>
  );
}
