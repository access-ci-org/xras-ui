import { useAtomValue, useSetAtom } from "jotai";
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
import type { FilterSelections } from "./types";

const Filters = () => {
  const filterOptions = useAtomValue(filterOptionsAtom);
  const filterSelections = useAtomValue(filterSelectionsAtom);
  const updateFilterSelection = useSetAtom(updateFilterSelectionAtom);
  const resetPublications = useSetAtom(resetPublicationsAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const getPublications = useSetAtom(getPublicationsAtom);

  if (!filterOptions.journals) {
    return <p>Loading filters...</p>;
  }

  const handleSubmit = () => {
    resetPublications();
    window.scrollTo(0, 0);
    getPublications();
  };

  const handleReset = () => {
    resetPublications();
    resetFilters();
    window.scrollTo(0, 0);
    getPublications();
  };

  const updateSelection = (name: keyof FilterSelections, value: string) =>
    updateFilterSelection({ name, value });

  return (
    <div className="sticky top-0 mb-2">
      <h3 className="mb-2">Filters</h3>

      <div className="mb-3">
        <Label htmlFor="journal_select">Journals</Label>
        <Input
          placeholder="Type to search..."
          list="journal_list"
          id="journal_select"
          value={filterSelections.journal}
          onChange={(e) => updateSelection("journal", e.target.value)}
        />
        <datalist id="journal_list">
          {filterOptions.journals.map((j) => (
            <option value={j} key={j}>
              {j}
            </option>
          ))}
        </datalist>
      </div>

      <div className="mb-3">
        <Label htmlFor="authorName">Author Name</Label>
        <Input
          placeholder="Last Name, First Initial"
          id="authorName"
          value={filterSelections.authorName}
          onChange={(e) => updateSelection("authorName", e.target.value)}
        />
      </div>

      <div className="mb-3">
        <Label htmlFor="doiNumber">DOI</Label>
        <Input
          id="doiNumber"
          value={cleanDOI(filterSelections.doi) || ""}
          onChange={(e) => updateSelection("doi", e.target.value)}
        />
      </div>

      <div className="mb-3">
        <Label htmlFor="publication_type_select">Publication Type</Label>
        <Select
          value={filterSelections.publicationType || "__all__"}
          onValueChange={(value) => updateSelection("publicationType", value === "__all__" ? "" : value)}
        >
          <SelectTrigger id="publication_type_select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">-- All --</SelectItem>
            {filterOptions.publication_types.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2 flex gap-2">
        <Button onClick={handleSubmit}>Submit</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default Filters;
