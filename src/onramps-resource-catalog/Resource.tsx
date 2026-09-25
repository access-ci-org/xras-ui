import { SquareArrowOutUpRight } from "lucide-react";
import styles from "./ResourceCatalog.module.scss";
import Features from "./Features";
import {
  CARD,
  CARD_BODY,
  CARD_FOOTER,
  CARD_HEADER,
  COL,
  ICON,
  LIST_GROUP,
  LIST_GROUP_ITEM,
  ROW,
} from "./catalogTheme";
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
          <div className="mb-4">
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: resource.recommendedUse }}
            />
          </div>
        </>
      );
    }
    return "";
  };

  const renderHeader = () => {
    const headerStyle = {
      background:
        "linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(26, 91, 110, 1) 50%)",
      display: "flex",
      justifyContent: "space-between",
    };

    return (
      <div className={CARD_HEADER} style={headerStyle}>
        <span className="font-bold">
          {renderLogo()}
          {resource.resourceName}
        </span>
      </div>
    );
  };

  const renderRelatedResources = () => {
    if (!resource.relatedResources || resource.relatedResources.length == 0)
      return "";

    return (
      <>
        <div className="font-bold">Related Resources</div>
        <ul className={LIST_GROUP}>
          {resource.relatedResources.map((rr) => (
            <a
              key={`rr_${resource.resourceId}_${rr.cider_resource_id}`}
              className={LIST_GROUP_ITEM}
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

    return (
      /* Preflight makes images block-level, which breaks the name onto a second line. */
      <img
        className="inline"
        style={{ width: "20px", marginRight: "5px" }}
        src={resource.icon}
        alt=""
      />
    );
  };

  return (
    <div className={`${CARD} mb-4`}>
      {renderHeader()}
      <div className={CARD_BODY}>
        <div className={ROW}>
          <div className={`${COL} md:w-2/3`}>
            {renderUse()}
            {renderFeatures()}
          </div>
          <div className={`${COL} md:w-1/3`}>{renderRelatedResources()}</div>
        </div>
      </div>
      <div className={CARD_FOOTER}>
        <a
          target="_blank"
          rel="noreferrer"
          href={`https://allocations.access-ci.org/resources/${resource.groupId}`}
          className="font-bold text-black underline"
        >
          Learn more about {resource.displayResourceName}
          <SquareArrowOutUpRight className={`${ICON} ml-2`} />
        </a>
      </div>
    </div>
  );
};

export default Resource;
