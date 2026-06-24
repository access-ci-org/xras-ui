import { ArrowUpRight } from "lucide-react";
import styles from "./ResourceCatalog.module.scss";
import Features from "./Features";
import type { Resource as ResourceType } from "./types";

const Resource = ({ resource }: { resource: ResourceType }) => {
  const renderFeatures = () => {
    return (
      <>
        <div className="font-bold">Features</div>
        <div className="mb-2">
          <Features features={resource.features} id={resource.resourceId} />
        </div>
      </>
    );
  };

  const renderUse = () => {
    if (resource.recommendedUse && resource.recommendedUse != "") {
      return (
        <>
          <div className="font-bold">Recommended Use</div>
          <div className="mb-3">
            <div className={styles.description} dangerouslySetInnerHTML={{ __html: resource.recommendedUse }} />
          </div>
        </>
      );
    }
    return "";
  };

  const renderHeader = () => {
    const headerStyle = {
      background: "linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(26, 91, 110, 1) 50%)",
      display: "flex",
      justifyContent: "space-between",
    };

    return (
      <div className="border-b p-3" style={headerStyle}>
        <span className="font-bold">
          {renderLogo()}
          {resource.resourceName}
        </span>
      </div>
    );
  };

  const renderRelatedResources = () => {
    if (!resource.relatedResources || resource.relatedResources.length == 0) return "";

    return (
      <>
        <div className="font-bold">Related Resources</div>
        <ul className="flex flex-col">
          {resource.relatedResources.map((rr) => (
            <a
              key={`rr_${resource.resourceId}_${rr.cider_resource_id}`}
              className="border px-3 py-2 hover:bg-accent hover:text-accent-foreground"
              href={`https://allocations.access-ci.org/resources/${resource.groupId}`}
              target="_blank"
              rel="noreferrer"
            >
              {rr.displayResourceName}
            </a>
          ))}
        </ul>
      </>
    );
  };

  const renderLogo = () => {
    if (!resource.icon) return;

    return <img style={{ width: "20px", marginRight: "5px" }} src={resource.icon} alt="" />;
  };

  return (
    <div className="mb-3 border">
      {renderHeader()}
      <div className="p-3">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 basis-full md:basis-2/3">
            {renderUse()}
            {renderFeatures()}
          </div>
          <div className="flex-1 basis-full md:basis-1/3">{renderRelatedResources()}</div>
        </div>
      </div>
      <div className="border-t p-3">
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://allocations.access-ci.org/resources/${resource.groupId}`}
          className="inline-flex items-center gap-2 font-bold text-black"
        >
          Learn more about {resource.displayResourceName}
          <ArrowUpRight className="size-4" />
        </a>
      </div>
    </div>
  );
};

export default Resource;
