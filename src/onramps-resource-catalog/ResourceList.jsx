import React from "react";
import { useSelector } from "react-redux";
import { selectResources, selectSelectedCategory } from "./helpers/catalogSlice";
import Resource from "./Resource";
import FilterBar from "./FilterBar";
import descriptions from "./helpers/descriptions";

const ResourceList = () => {
  const resources = useSelector(selectResources);
  const selectedCategory = useSelector( selectSelectedCategory );
  const categories = [
    {label: "CPU Compute", key: "CPU", icon: "cpu-fill"},
    {label: "GPU Compute", key: "GPU", icon: "gpu-card"},
    {label: "Innovative/Novel Compute", key: "Innovative", icon: "lightbulb"},
    {label: "Cloud", key: "Cloud", icon: "cloud"},
    {label: "Storage", key: "Storage", icon: "hdd-fill"}
  ]
  if (resources.length == 0) {
    return <div className="fw-bold">No Resources Match Your Filters</div>;
  }

  const renderCategoryDescription = (key) => {
    const styles = {
      padding: "10px",
      // border: "1px solid #48c0b9",
      border: "3px solid rgb(254, 196, 45)",
      borderRadius: "10px",
      marginBottom: "10px"
    };

    return (
      <div style={styles}>
        { descriptions[key] }
      </div>
    )
  }

  const renderResources = (categoryResources) => {
    return categoryResources.map((r) => (
      <Resource resource={r} key={r.resourceId} />
    ))
  }

  const renderCategory = (category) => {
    const categoryResources = resources.filter((r) => r.resourceCategory == category.key);
    if(categoryResources.length == 0) return "";

    return (
      <React.Fragment key={`category_${category.key}`}>
        <h4
          style={{
            position: "sticky",
            top: "58px",
            fontFamily: "Archivo, sans-serif",
            borderBottom: "1px solid #999",
            backgroundColor:"rgb(26, 91, 110)",
            color: "#FFF",
            // backgroundColor: "rgb(254, 196, 45)",
            // color: "#000",
            zIndex: 10,
            paddingLeft: "10px",
            paddingBottom: "5px",
            paddingTop: "5px"
          }}
        >
          <i className={`bi bi-${category.icon}`}></i> {category.label}
        </h4>
        { renderResources(categoryResources) }
      </React.Fragment>
    )
  }

  return (
    <div className="card shadow">
      <div className="card-body">
        <FilterBar />
        {categories.map((category) => renderCategory(category))}

      </div>
    </div>
  );
};

export default ResourceList;
