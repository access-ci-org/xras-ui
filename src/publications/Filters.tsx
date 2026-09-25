import { useAtomValue, useSetAtom } from "jotai";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cleanDOI } from "./PublicationCitation";
import {
  filterOptionsAtom,
  filterSelectionsAtom,
  getPublicationsAtom,
  resetFiltersAtom,
  resetPublicationsAtom,
  updateFilterSelectionAtom,
} from "./atoms";

/*
 * The old filter labels were `h5` elements — 1rem, semibold, on the theme's 1.2
 * heading line height — rather than `.form-label`s, and the `Label` here keeps
 * that size so the sidebar reads the same. `mb-1` stands in for the `mb-1` they
 * carried, and `block` for the fact that a heading is one: a bare `Label` is
 * inline, and would be nudged down by the line box around it.
 */
const LABEL = "mb-1 block text-base font-semibold leading-[1.2]";

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

      <div className="mb-4">
        <Label htmlFor="journal_select" className={LABEL}>
          Journals
        </Label>
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

      <div className="mb-4">
        <Label htmlFor="authorName" className={LABEL}>
          Author Name
        </Label>
        <form.Field name="authorName">
          {(field) => (
            <Input
              placeholder="Last Name, First Initial"
              id="authorName"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>
      </div>

      <div className="mb-4">
        <Label htmlFor="doiNumber" className={LABEL}>
          DOI
        </Label>
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

      <div className="mb-4">
        <Label htmlFor="publication_type_select" className={LABEL}>
          Publication Type
        </Label>
        <form.Field name="publicationType">
          {(field) => (
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value)}
            >
              <SelectTrigger id="publication_type_select">
                <SelectValue placeholder="-- All --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">-- All --</SelectItem>
                {filterOptions.publication_types.map((a) => (
                  <SelectItem value={a} key={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form.Field>
      </div>

      <div className="mt-2 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
};

export default Filters;
