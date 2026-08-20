import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { filteredResourcesAtom } from "./atoms";
import Resource from "./Resource";
import FilterBar from "./FilterBar";
import { categoryIcons } from "./helpers/icons";
import { CARD, CARD_BODY, CARD_SHADOW, ICON } from "./catalogTheme";
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
    const categoryResources = resources.filter(
      (r) => r.resourceCategory == category.key,
    );
    if (categoryResources.length == 0) return "";

    const Icon = categoryIcons[category.key];

    return (
      <Fragment key={`category_${category.key}`}>
        <h4
          className="sticky z-10 border-b py-[5px] pl-[10px]"
          style={{
            top: "58px",
            color: "#fff",
            fontFamily: "Archivo, sans-serif",
            borderBottomColor: "#999",
            backgroundColor: "rgb(26, 91, 110)",
          }}
        >
          {Icon && <Icon className={ICON} />} {category.label}
        </h4>
        {renderResources(categoryResources)}
      </Fragment>
    );
  };

  return (
    <div className={`${CARD} ${CARD_SHADOW}`}>
      <div className={CARD_BODY}>
        <FilterBar />
        {categories.map((category) => renderCategory(category))}
      </div>
    </div>
  );
};

export default ResourceList;
