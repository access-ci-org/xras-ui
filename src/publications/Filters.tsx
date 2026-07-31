import { useAtomValue, useSetAtom } from "jotai";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cleanDOI } from "./PublicationCitation";
import {
  filterOptionsAtom,
  filterSelectionsAtom,
  getPublicationsAtom,
  resetFiltersAtom,
  resetPublicationsAtom,
  updateFilterSelectionAtom,
} from "./atoms";

const emptyFilters = {
  journal: "",
  authorName: "",
  doi: "",
  publicationType: "__all__",
};

const Filters = () => {
  const filterOptions = useAtomValue(filterOptionsAtom);
  const filterSelections = useAtomValue(filterSelectionsAtom);
  const updateFilterSelection = useSetAtom(updateFilterSelectionAtom);
  const resetPublications = useSetAtom(resetPublicationsAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const getPublications = useSetAtom(getPublicationsAtom);

  const form = useAppForm({
    defaultValues: {
      journal: filterSelections.journal,
      authorName: filterSelections.authorName,
      doi: filterSelections.doi,
      publicationType: filterSelections.publicationType || "__all__",
    },
    onSubmit: ({ value }) => {
      (Object.keys(value) as (keyof typeof value)[]).forEach((name) =>
        updateFilterSelection({
          name,
          value: name === "publicationType" && value[name] === "__all__" ? "" : value[name],
        }),
      );
      resetPublications();
      window.scrollTo(0, 0);
      getPublications();
    },
  });

  if (!filterOptions.journals) {
    return <p>Loading filters...</p>;
  }

  const handleReset = () => {
    form.reset(emptyFilters);
    resetPublications();
    resetFilters();
    window.scrollTo(0, 0);
    getPublications();
  };

  return (
    <form
      className="sticky top-0 mb-2"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h3 className="mb-2">Filters</h3>

      <div className="mb-3">
        <Label htmlFor="journal_select">Journals</Label>
        <form.Field name="journal">
          {(field) => (
            <Input
              placeholder="Type to search..."
              list="journal_list"
              id="journal_select"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
        <datalist id="journal_list">
          {filterOptions.journals.map((j) => (
            <option value={j} key={j}>
              {j}
            </option>
          ))}
        </datalist>
      </div>

      <form.AppField name="authorName">
        {(field) => (
          <field.FieldInput label="Author Name" placeholder="Last Name, First Initial" />
        )}
      </form.AppField>

      <div className="mb-3">
        <Label htmlFor="doiNumber">DOI</Label>
        <form.Field name="doi">
          {(field) => (
            <Input
              id="doiNumber"
              value={cleanDOI(field.state.value) || ""}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <form.AppField name="publicationType">
        {(field) => (
          <field.FieldSelect
            label="Publication Type"
            placeholder="-- All --"
            options={[
              { value: "__all__", label: "-- All --" },
              ...filterOptions.publication_types.map((a) => ({ value: a, label: a })),
            ]}
          />
        )}
      </form.AppField>

      <div className="mt-2 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
};

export default Filters;
