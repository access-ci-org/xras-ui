import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ACCORDION_BODY,
  ACCORDION_BUTTON,
  ACCORDION_ITEM,
  COL,
  ROW,
  TABLE,
  TD,
  TD_LABEL,
} from "./catalogTheme";
import type { Resource as ResourceType } from "./types";

const renderFeatures = (resourceId: number, features: string[]) => {
  if (features.length == 0) return "";

  return (
    <ul>
      {features.map((f, i) => (
        <li key={`feature_${resourceId}_${i}`}>{f}</li>
      ))}
    </ul>
  );
};

const renderDescription = (title: string, content: string) => {
  if (!content) return "";

  return (
    <>
      <div className={ROW}>
        <div className={`${COL} font-bold`}>{title}</div>
      </div>
      <div className={`${ROW} mb-4`}>
        <div className={COL} dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </>
  );
};

const Resource = ({ resource }: { resource: ResourceType }) => {
  return (
    <AccordionItem
      className={ACCORDION_ITEM}
      value={String(resource.resourceId)}
    >
      <AccordionTrigger className={ACCORDION_BUTTON}>
        {resource.resourceName}
      </AccordionTrigger>
      <AccordionContent className={ACCORDION_BODY}>
        <table className={TABLE}>
          <tbody>
            <tr>
              <td className={TD_LABEL}>Resource Type:</td>
              <td className={TD}>{resource.resourceType}</td>
            </tr>
            <tr>
              <td className={TD_LABEL}>Organization:</td>
              <td className={TD}>{resource.organization}</td>
            </tr>
            <tr>
              <td className={TD_LABEL}>Units:</td>
              <td className={TD}>{resource.units}</td>
            </tr>
            <tr>
              <td className={TD_LABEL}>User Guide:</td>
              <td className={TD}>
                {resource.userGuideUrl == "" ? (
                  ""
                ) : (
                  <a
                    href={resource.userGuideUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Link to User Guide
                  </a>
                )}
              </td>
            </tr>
            <tr>
              <td className={TD_LABEL}>Features Available:</td>
              <td className={TD}>
                {renderFeatures(resource.resourceId, resource.features)}
              </td>
            </tr>
          </tbody>
        </table>
        {renderDescription(
          "Resource Description",
          resource.resourceDescription,
        )}
        {renderDescription("Allocations Description", resource.description)}
        {renderDescription("Recommended Use", resource.recommendedUse)}
      </AccordionContent>
    </AccordionItem>
  );
};

export default Resource;
