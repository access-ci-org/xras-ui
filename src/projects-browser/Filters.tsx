import { useAtomValue, useSetAtom } from "jotai";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  commitFiltersAtom,
  filtersAtom,
  filtersLoadedAtom,
  getProjectsAtom,
  listIsFilteredAtom,
  resetFiltersAtom,
  typeListsAtom,
  updatePageDataAtom,
} from "./atoms";

/*
 * A `.form-check-label` is plain body copy rather than a `.form-label`, which
 * the theme draws small and heavy — the size the `Label` component defaults to.
 */
const CHECK_LABEL = "text-base font-normal leading-6";

const Filters = () => {
  const filtersLoaded = useAtomValue(filtersLoadedAtom);
  return filtersLoaded ? <FiltersForm /> : <p>Loading filters...</p>;
};

const FiltersForm = () => {
  const filters = useAtomValue(filtersAtom);
  const typeLists = useAtomValue(typeListsAtom);
  const filtered = useAtomValue(listIsFilteredAtom);
  const setListIsFiltered = useSetAtom(listIsFilteredAtom);
  const getProjects = useSetAtom(getProjectsAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const commitFilters = useSetAtom(commitFiltersAtom);
  const updatePageData = useSetAtom(updatePageDataAtom);

  const allFosIds = typeLists.fosTypes.map((fos) => fos.fosTypeId);

  const form = useAppForm({
    defaultValues: {
      ...filters,
      allocationType: filters.allocationType || "__all__",
      resource: filters.resource || "__all__",
    },
    onSubmit: ({ value }) => {
      commitFilters({
        ...value,
        allocationType: value.allocationType === "__all__" ? "" : value.allocationType,
        resource: value.resource === "__all__" ? "" : value.resource,
      });
      window.scrollTo(0, 0);
      setListIsFiltered(true);
      updatePageData({ current_page: 1 });
      getProjects();
    },
  });

  const buttonDisabled =
    filters.org === "" &&
    filters.allocationType === "" &&
    filters.fosTypeIds.length === allFosIds.length &&
    filters.resource === "" &&
    filters.requestNumber === "";

  const handleReset = () => {
    form.reset({
      org: "",
      allocationType: "__all__",
      fosTypeIds: allFosIds,
      resource: "__all__",
      requestNumber: "",
    });
    updatePageData({ current_page: 1 });
    resetFilters();
    if (filtered) {
      window.scrollTo(0, 0);
      getProjects();
      setListIsFiltered(false);
    }
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
      <h5 className="mb-1">Field of Science</h5>
      <form.Field name="fosTypeIds">
        {(field) => (
          <div className="mb-4 h-[200px] overflow-x-auto border p-0.5">
            <div className="mb-0.5 flex min-h-6 gap-2">
              <Checkbox
                className="mt-1"
                id="toggle_all"
                checked={field.state.value.length === allFosIds.length}
                onCheckedChange={() =>
                  field.handleChange(field.state.value.length === allFosIds.length ? [] : allFosIds)
                }
              />
              <Label htmlFor="toggle_all" className={CHECK_LABEL}>
                (Toggle All)
              </Label>
            </div>
            {typeLists.fosTypes.map((fos) => (
              <div className="mb-0.5 flex min-h-6 gap-2" key={`fos_${fos.fosTypeId}`}>
                <Checkbox
                  className="mt-1"
                  id={`fos_${fos.fosTypeId}`}
                  checked={field.state.value.includes(fos.fosTypeId)}
                  onCheckedChange={() =>
                    field.handleChange(
                      field.state.value.includes(fos.fosTypeId)
                        ? field.state.value.filter((id) => id !== fos.fosTypeId)
                        : [...field.state.value, fos.fosTypeId],
                    )
                  }
                />
                <Label htmlFor={`fos_${fos.fosTypeId}`} className={CHECK_LABEL}>
                  {fos.fosName}
                </Label>
              </div>
            ))}
          </div>
        )}
      </form.Field>

      <h5 id="org_select_label" className="mb-1">
        Organization
      </h5>
      <div className="mb-4">
        <form.AppField name="org">
          {(field) => (
            <field.FieldReactSelect
              options={typeLists.orgs.map((org) => ({ label: org, value: org }))}
              openMenuOnClick
              closeMenuOnSelect
              aria-labelledby="org_select_label"
            />
          )}
        </form.AppField>
      </div>

      <h5 id="project_type_label" className="mb-1">
        <abbr title='A specific level of allocation; also referred to as "Opportunity"'>
          Project Type
        </abbr>
      </h5>
      <div className="mb-4">
        <form.AppField name="allocationType">
          {(field) => (
            <field.FieldSelect
              placeholder="-- All --"
              options={[
                { value: "__all__", label: "-- All --" },
                ...typeLists.allocationTypes.map((a) => ({ value: a, label: a })),
              ]}
            />
          )}
        </form.AppField>
      </div>

      <h5 id="resource_filter_label" className="mb-1">
        Resource
      </h5>
      <div className="mb-4">
        <form.AppField name="resource">
          {(field) => (
            <field.FieldSelect
              placeholder="-- All --"
              options={[
                { value: "__all__", label: "-- All --" },
                ...typeLists.resources.map((res) => ({
                  value: res.resourceId.toString(),
                  label: res.resourceName,
                })),
              ]}
            />
          )}
        </form.AppField>
      </div>

      <h5 id="request_number_label" className="mb-1">
        Request Number
      </h5>
      <div className="mb-4">
        <form.AppField name="requestNumber">
          {(field) => <field.FieldInput type="text" />}
        </form.AppField>
      </div>

      <div className="mt-2 flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="secondary" disabled={buttonDisabled} onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
};

export default Filters;
