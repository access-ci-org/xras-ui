import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { filteredResourcesAtom } from "./atoms";
import Resource from "./Resource";
import FilterBar from "./FilterBar";
import { categoryIcons } from "./helpers/icons";
import type { Resource as ResourceType } from "./types";

const categories = [
  { label: "CPU Compute", key: "CPU" },
  { label: "GPU Compute", key: "GPU" },
  { label: "Innovative/Novel Compute", key: "Innovative" },
  { label: "Cloud", key: "Cloud" },
  { label: "Storage", key: "Storage" },
];

const ResourceList = () => {
  const resources = useAtomValue(filteredResourcesAtom);

  if (resources.length == 0) {
    return <div className="font-bold">No Resources Match Your Filters</div>;
  }

  const renderResources = (categoryResources: ResourceType[]) =>
    categoryResources.map((r) => <Resource resource={r} key={r.resourceId} />);

  const renderCategory = (category: { label: string; key: string }) => {
    const categoryResources = resources.filter((r) => r.resourceCategory == category.key);
    if (categoryResources.length == 0) return "";

    const Icon = categoryIcons[category.key];

    return (
      <Fragment key={`category_${category.key}`}>
        <h4
          className="sticky z-10 flex items-center gap-2 border-b px-2.5 py-1.5 text-white"
          style={{
            top: "58px",
            fontFamily: "Archivo, sans-serif",
            borderBottomColor: "#999",
            backgroundColor: "rgb(26, 91, 110)",
          }}
        >
          {Icon && <Icon className="size-4" />} {category.label}
        </h4>
        {renderResources(categoryResources)}
      </Fragment>
    );
  };

  return (
    <div className="border shadow">
      <div className="p-4">
        <FilterBar />
        {categories.map((category) => renderCategory(category))}
      </div>
    </div>
  );
};

export default ResourceList;
