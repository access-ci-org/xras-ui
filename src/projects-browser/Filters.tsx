import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  filtersAtom,
  getProjectsAtom,
  listIsFilteredAtom,
  resetFiltersAtom,
  toggleAllFosAtom,
  toggleFosAtom,
  typeListsAtom,
  updateFilterAtom,
  updatePageDataAtom,
} from "./atoms";

const Filters = () => {
  const filters = useAtomValue(filtersAtom);
  const typeLists = useAtomValue(typeListsAtom);
  const filtered = useAtomValue(listIsFilteredAtom);
  const setListIsFiltered = useSetAtom(listIsFilteredAtom);
  const getProjects = useSetAtom(getProjectsAtom);
  const resetFilters = useSetAtom(resetFiltersAtom);
  const toggleAllFos = useSetAtom(toggleAllFosAtom);
  const toggleFos = useSetAtom(toggleFosAtom);
  const updateFilter = useSetAtom(updateFilterAtom);
  const updatePageData = useSetAtom(updatePageDataAtom);

  const orgList = typeLists.orgs.map((org) => ({ label: org, value: org }));
  const [orgValue, setOrgValue] = useState<{ label: string; value: string } | null>(null);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    updateFilter({ name: e.target.name as keyof typeof filters, value: e.target.value });
  };

  const handleSubmit = () => {
    window.scrollTo(0, 0);
    setListIsFiltered(true);
    updatePageData({ current_page: 1 });
    getProjects();
  };

  const handleReset = () => {
    setOrgValue(null);
    updatePageData({ current_page: 1 });
    resetFilters();
    if (filtered) {
      window.scrollTo(0, 0);
      getProjects();
      setListIsFiltered(false);
    }
  };

  const updateOrgs = (opt: { label: string; value: string } | null) => {
    setOrgValue(opt);
    updateFilter({ name: "org", value: opt?.value ?? "" });
  };

  const buttonDisabled =
    filters.org == "" &&
    filters.allocationType == "" &&
    filters.allFosToggled &&
    filters.resource == "" &&
    filters.requestNumber == "";

  return (
    <div className="sticky top-0 mb-2">
      <h3 className="mb-2">Filters</h3>
      <h5 className="mb-1">Field of Science</h5>
      <div className="mb-3 h-[200px] overflow-x-auto border p-0.5">
        <div className="flex items-center gap-2">
          <Checkbox
            id="toggle_all"
            checked={filters.allFosToggled}
            onCheckedChange={() => toggleAllFos()}
          />
          <Label htmlFor="toggle_all" className="font-normal">
            (Toggle All)
          </Label>
        </div>
        {typeLists.fosTypes.map((fos) => (
          <div className="flex items-center gap-2" key={`fos_${fos.fosTypeId}`}>
            <Checkbox
              id={`fos_${fos.fosTypeId}`}
              checked={fos.checked}
              onCheckedChange={() => toggleFos(fos)}
            />
            <Label htmlFor={`fos_${fos.fosTypeId}`} className="font-normal">
              {fos.fosName}
            </Label>
          </div>
        ))}
      </div>

      <h5 id="org_select_label" className="mb-1">
        Organization
      </h5>
      <div className="mb-3">
        <Select
          key="org_select"
          options={orgList}
          openMenuOnClick={true}
          name="org"
          inputId="orgs_filter"
          closeMenuOnSelect={true}
          onChange={updateOrgs}
          value={orgValue}
          aria-labelledby="org_select_label"
        />
      </div>

      <h5 id="project_type_label" className="mb-1">
        <abbr title='A specific level of allocation; also referred to as "Opportunity"'>
          Project Type
        </abbr>
      </h5>
      <div className="mb-3">
        <select
          name="allocationType"
          id="project_type_select"
          value={filters.allocationType}
          className="w-full border border-input bg-transparent px-3 py-1 shadow-sm"
          aria-labelledby="project_type_label"
          onChange={handleFilterChange}
        >
          <option value="">-- All --</option>
          {typeLists.allocationTypes.map((a, i) => (
            <option value={a} key={`allocation_type_${i}`}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <h5 id="resource_filter_label" className="mb-1">
        Resource
      </h5>
      <div className="mb-3">
        <select
          name="resource"
          id="resource_select"
          value={filters.resource}
          className="w-full border border-input bg-transparent px-3 py-1 shadow-sm"
          aria-labelledby="resource_filter_label"
          onChange={handleFilterChange}
        >
          <option value="">-- All --</option>
          {typeLists.resources.map((res, i) => (
            <option value={res.resourceId} key={`resource_${i}`}>
              {res.resourceName}
            </option>
          ))}
        </select>
      </div>

      <h5 id="request_number_label" className="mb-1">
        Request Number
      </h5>
      <div className="mb-3">
        <input
          type="text"
          className="w-full border border-input bg-transparent px-3 py-1 shadow-sm"
          value={filters.requestNumber}
          name="requestNumber"
          id="requestNumber"
          aria-labelledby="request_number_label"
          onChange={handleFilterChange}
        />
      </div>

      <div className="mt-2 flex gap-2">
        <Button onClick={handleSubmit}>Submit</Button>
        <Button variant="outline" disabled={buttonDisabled} onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default Filters;
