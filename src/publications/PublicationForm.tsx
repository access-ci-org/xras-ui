import { useAtomValue, useSetAtom } from "jotai";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DoiSearch from "./DoiSearch";
import Authors from "./Authors";
import InfoTip from "../shared/InfoTip";
import Projects from "./Projects";
import ProjectSearch from "./ProjectSearch";
import Resources from "./Resources";
import {
  changePublicationTypeAtom,
  formValidAtom,
  publicationAtom,
  publicationTypesAtom,
  updatePublicationFieldAtom,
  updateFieldAtom,
} from "./atoms";

const START_YEAR = 1980;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const normalizePublicationYear = (value: unknown) => (value == null ? "" : `${value}`);

const normalizePublicationMonth = (value: unknown) => {
  if (value == null || value === "") return "";

  const numericMonth = Number(value);
  if (Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    return `${numericMonth}`;
  }

  const normalizedMonth = `${value}`.trim().toLowerCase();
  const monthIndex = MONTHS.findIndex((month) => month.toLowerCase() === normalizedMonth);
  return monthIndex >= 0 ? `${monthIndex + 1}` : "";
};

export default function PublicationForm() {
  const publication = useAtomValue(publicationAtom);
  const publicationTypes = useAtomValue(publicationTypesAtom);
  const formValid = useAtomValue(formValidAtom);
  const setFormValid = useSetAtom(formValidAtom);
  const updatePublicationField = useSetAtom(updatePublicationFieldAtom);
  const updateField = useSetAtom(updateFieldAtom);
  const changePublicationType = useSetAtom(changePublicationTypeAtom);

  if (!publication) return null;

  const updateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValid(e.target.value.trim() !== "");
    updatePublicationField({ key: "title", value: e.target.value });
  };

  const lastYear = new Date().getFullYear() + 2;
  const years = Array.from({ length: lastYear - START_YEAR + 1 }, (_, idx) => START_YEAR + idx);

  const publicationYearValue = normalizePublicationYear(publication.publication_year);
  const publicationMonthValue = normalizePublicationMonth(publication.publication_month);

  return (
    <>
      <div className="border">
        <div className="border-b p-3">
          <h2>Publication Information</h2>
        </div>
        <div className="p-3">
          <p className="mb-2">
            Enter information about this publication below. If you have a DOI, you may use the
            &quot;Lookup Publication&quot; button to attempt to find this information
            automatically.
          </p>

          <DoiSearch />

          <div className="mb-3">
            <Label htmlFor="publication_type">Publication Type</Label>
            <Select
              value={(publication.publication_type as string) || undefined}
              onValueChange={(value) => changePublicationType(value)}
            >
              <SelectTrigger id="publication_type" className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {publicationTypes.map((pt) => (
                  <SelectItem key={pt.publication_type} value={pt.publication_type}>
                    {pt.publication_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-3">
            <Label htmlFor="publication_title">
              Title <i className="bi bi-asterisk text-destructive" />
            </Label>
            <Input
              id="publication_title"
              className={formValid ? "max-w-xl" : "max-w-xl border-destructive"}
              value={(publication.title as string) || ""}
              onChange={updateTitle}
            />
          </div>

          <div className="mb-3">
            <Label htmlFor="publication_year">Year Published</Label>
            <Select
              value={publicationYearValue || undefined}
              onValueChange={(value) => updatePublicationField({ key: "publication_year", value })}
            >
              <SelectTrigger id="publication_year" className="max-w-xs">
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={`${year}`}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-3">
            <Label htmlFor="publication_month">Month Published</Label>
            <Select
              value={publicationMonthValue || undefined}
              onValueChange={(value) => updatePublicationField({ key: "publication_month", value })}
            >
              <SelectTrigger id="publication_month" className="max-w-xs">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={month} value={`${idx + 1}`}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {publication.fields.map((f, idx) => (
            <div key={f.csl_field_name} className="mb-3">
              <Label htmlFor={`field_${f.csl_field_name}`}>{f.name}</Label>
              <Input
                id={`field_${f.csl_field_name}`}
                className="max-w-xl"
                value={f.field_value || ""}
                onChange={(e) => updateField({ index: idx, value: e.target.value })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 border">
        <div className="flex items-center justify-between border-b p-3">
          <h2>Authors</h2>
          <InfoTip>
            Add authors by clicking the &quot;Add Author&quot; button below and entering the
            author&apos;s details. You may also remove authors by clicking the{" "}
            <i className="bi bi-trash fw-bold text-destructive" /> button
          </InfoTip>
        </div>
        <div className="p-3">
          <Authors />
        </div>
      </div>

      <div className="mt-3 border">
        <div className="flex items-center justify-between border-b p-3">
          <h2>Associated Projects</h2>
          <InfoTip>Click/Tap each project that this publication is related to.</InfoTip>
        </div>
        <div className="p-3">
          <Projects />
          <hr className="my-3" />
          <ProjectSearch />
        </div>
      </div>

      <div className="mt-3 border">
        <div className="flex items-center justify-between border-b p-3">
          <h2>Resources</h2>
          <InfoTip>
            Select the resources that were used in this publication. Resources are shown from the
            projects you selected above.
          </InfoTip>
        </div>
        <div className="p-3">
          <Resources />
        </div>
      </div>
    </>
  );
}
