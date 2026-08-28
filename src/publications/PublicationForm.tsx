import { useAtomValue, useSetAtom } from "jotai";
import { Trash2 } from "lucide-react";
import { useAppForm } from "@/components/form";
import { FormItem } from "@/components/form/field-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { routesAtom } from "../shared/routes";
import DoiSearch from "./DoiSearch";
import Authors from "./Authors";
import InfoTip from "../shared/InfoTip";
import Projects from "./Projects";
import ProjectSearch from "./ProjectSearch";
import Resources from "./Resources";
import { invalidFormAlert, validateForm } from "./FormValidation";
import { buildPublicationRequest } from "./helpers/request";
import {
  addErrorAtom,
  authenticityTokenAtom,
  errorsAtom,
  getPublicationDataAtom,
  hideErrorAtom,
  publicationAtom,
  publicationTypesAtom,
  resetPublicationEditStateAtom,
  resourcesNoneSelectedAtom,
  savingAtom,
  selectedProjectsAtom,
  selectedResourcesAtom,
  showEditModalAtom,
  showSavedAtom,
} from "./atoms";
import type {
  EditablePublication,
  PublicationAuthor,
  PublicationField,
  PublicationTypeOption,
  TagCategory,
} from "./types";

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

export type PublicationFormValues = {
  publication_id?: number | string;
  publication_type: string;
  title: string;
  publication_year: string;
  publication_month: string;
  doi: string;
  // Round-tripped, not edited: there is no peer-review control in this form, so
  // this only exists to hand the server's own value back to it. Dropping it is
  // what made every create fail - `publications.peer_reviewed` is NOT NULL with
  // no default, so an omitted key is a 500, not a default.
  peer_reviewed: boolean;
  fields: PublicationField[];
  authors: PublicationAuthor[];
  tags: TagCategory[];
  resourceIds: number[];
  resourcesNoneSelected: boolean;
  extraFields: Record<string, unknown>;
};

export function mergeFieldsForType(
  newType: string,
  currentFields: PublicationField[],
  publicationTypes: PublicationTypeOption[],
): PublicationField[] {
  const newFields = publicationTypes.find((pt) => pt.publication_type === newType)?.fields ?? [];
  return newFields.map((nf) => {
    const existing = currentFields.find((f) => f.csl_field_name === nf.csl_field_name);
    return existing ? { ...nf, field_value: existing.field_value } : nf;
  });
}

export default function PublicationForm() {
  const publication = useAtomValue(publicationAtom);
  if (!publication) return null;
  return <PublicationFormContent publication={publication} />;
}

function PublicationFormContent({ publication }: { publication: EditablePublication }) {
  const publicationTypes = useAtomValue(publicationTypesAtom);
  const selectedResourceIds = useAtomValue(selectedResourcesAtom);
  const resourcesNoneSelected = useAtomValue(resourcesNoneSelectedAtom);
  const selectedProjects = useAtomValue(selectedProjectsAtom);
  const authenticityToken = useAtomValue(authenticityTokenAtom);
  const errors = useAtomValue(errorsAtom);
  const routes = useAtomValue(routesAtom);
  const setShowEditModal = useSetAtom(showEditModalAtom);
  const setSaving = useSetAtom(savingAtom);
  const setShowSaved = useSetAtom(showSavedAtom);
  const addError = useSetAtom(addErrorAtom);
  const hideError = useSetAtom(hideErrorAtom);
  const resetPublicationEditState = useSetAtom(resetPublicationEditStateAtom);
  const getPublicationData = useSetAtom(getPublicationDataAtom);

  const defaultValues: PublicationFormValues = {
    publication_id: publication.publication_id,
    publication_type: publication.publication_type,
    title: publication.title,
    publication_year: normalizePublicationYear(publication.publication_year),
    publication_month: normalizePublicationMonth(publication.publication_month),
    doi: publication.doi ?? "",
    // `true` matches what the server's own `default_publication` sends for a
    // new publication, so the fallback only ever applies if that changes.
    peer_reviewed: publication.peer_reviewed ?? true,
    fields: publication.fields,
    authors: publication.authors.length > 0 ? publication.authors : [emptyAuthor()],
    tags: publication.tags ?? [],
    resourceIds: selectedResourceIds,
    resourcesNoneSelected,
    extraFields: {},
  };

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const { formValid, missingFields } = validateForm(
        value,
        ["title", "publication_year", "publication_month"],
        ["first_name", "last_name"],
      );

      if (!formValid) {
        errors.forEach((error) => hideError(error.id));
        addError(invalidFormAlert(missingFields));
        return;
      }

      const token =
        authenticityToken ||
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ||
        "";

      const { url, method, payload } = buildPublicationRequest(
        value,
        token,
        selectedProjects,
        routes,
      );

      setSaving(true);
      setShowSaved(false);

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Save failed with status ${response.status}`);

        if (!value.publication_id) {
          resetPublicationEditState();
          await getPublicationData(null);
        }

        setShowSaved(true);
      } catch {
        addError("There was an error saving this publication.");
      } finally {
        setSaving(false);
      }
    },
  });

  const lastYear = new Date().getFullYear() + 2;
  const years = Array.from({ length: lastYear - START_YEAR + 1 }, (_, idx) => START_YEAR + idx);

  return (
    <form
      className="flex min-h-0 grow flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <DialogBody>
        <Card>
          <CardHeader>
            <CardTitle>Publication Information</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="mb-2">
              Enter information about this publication below. If you have a DOI, you may use the
              &quot;Lookup Publication&quot; button to attempt to find this information
              automatically.
            </p>

            <DoiSearch form={form} />

            <FormItem>
              <Label htmlFor="publication_type">Publication Type</Label>
              <form.Field name="publication_type">
                {(field) => (
                  <Select
                    value={field.state.value || undefined}
                    onValueChange={(value) => {
                      field.handleChange(value);
                      form.setFieldValue(
                        "fields",
                        mergeFieldsForType(value, form.getFieldValue("fields"), publicationTypes),
                      );
                    }}
                  >
                    <SelectTrigger id="publication_type">
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
                )}
              </form.Field>
            </FormItem>

            <form.AppField
              name="title"
              validators={{
                onChange: ({ value }) => (value.trim() === "" ? "Title is required" : undefined),
              }}
            >
              {(field) => <field.FieldInput label="Title" required />}
            </form.AppField>

            <FormItem>
              <Label htmlFor="publication_year">Year Published</Label>
              <form.Field name="publication_year">
                {(field) => (
                  <Select value={field.state.value || undefined} onValueChange={field.handleChange}>
                    <SelectTrigger id="publication_year">
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
                )}
              </form.Field>
            </FormItem>

            <FormItem>
              <Label htmlFor="publication_month">Month Published</Label>
              <form.Field name="publication_month">
                {(field) => (
                  <Select value={field.state.value || undefined} onValueChange={field.handleChange}>
                    <SelectTrigger id="publication_month">
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
                )}
              </form.Field>
            </FormItem>

            <form.Field name="fields" mode="array">
              {(fieldsField) =>
                fieldsField.state.value.map((f, idx) => (
                  <FormItem key={f.csl_field_name}>
                    <Label htmlFor={`field_${f.csl_field_name}`}>{f.name}</Label>
                    <form.Field name={`fields[${idx}].field_value`}>
                      {(field) => (
                        <Input
                          id={`field_${f.csl_field_name}`}
                          value={field.state.value || ""}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )}
                    </form.Field>
                  </FormItem>
                ))
              }
            </form.Field>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Authors</CardTitle>
            <InfoTip>
              Add authors by clicking the &quot;Add Author&quot; button below and entering the
              author&apos;s details. You may also remove authors by clicking the{" "}
              <Trash2 className="inline size-4 text-destructive" /> button
            </InfoTip>
          </CardHeader>
          <CardBody>
            <Authors form={form} />
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Associated Projects</CardTitle>
            <InfoTip>Click/Tap each project that this publication is related to.</InfoTip>
          </CardHeader>
          <CardBody>
            <Projects />
            <hr />
            <ProjectSearch />
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <InfoTip>
              Select the resources that were used in this publication. Resources are shown from the
              projects you selected above.
            </InfoTip>
          </CardHeader>
          <CardBody>
            <Resources form={form} />
          </CardBody>
        </Card>
      </DialogBody>

      <form.Subscribe
        selector={(state) => ({
          title: state.values.title,
          authors: state.values.authors,
          resourceIds: state.values.resourceIds,
          resourcesNoneSelected: state.values.resourcesNoneSelected,
        })}
      >
        {({ title, authors, resourceIds, resourcesNoneSelected: noneSelected }) => {
          const authorsExist =
            authors.length > 0 && authors.every((a) => a.first_name !== "" && a.last_name !== "");
          const canSave =
            title.trim() !== "" &&
            authorsExist &&
            selectedProjects.length > 0 &&
            (resourceIds.length > 0 || noneSelected);

          return (
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  if (!canSave) return;
                  void form.handleSubmit();
                  setShowEditModal(false);
                }}
              >
                Save Publication
              </Button>
            </DialogFooter>
          );
        }}
      </form.Subscribe>
    </form>
  );
}
