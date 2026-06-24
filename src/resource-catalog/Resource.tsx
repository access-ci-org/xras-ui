import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
      <div className="font-bold">{title}</div>
      <div className="mb-3" dangerouslySetInnerHTML={{ __html: content }} />
    </>
  );
};

const Resource = ({ resource }: { resource: ResourceType }) => {
  return (
    <AccordionItem value={String(resource.resourceId)}>
      <AccordionTrigger>{resource.resourceName}</AccordionTrigger>
      <AccordionContent>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="pr-2 font-bold">Resource Type:</td>
              <td>{resource.resourceType}</td>
            </tr>
            <tr>
              <td className="pr-2 font-bold">Organization:</td>
              <td>{resource.organization}</td>
            </tr>
            <tr>
              <td className="pr-2 font-bold">Units:</td>
              <td>{resource.units}</td>
            </tr>
            <tr>
              <td className="pr-2 font-bold">User Guide:</td>
              <td>
                {resource.userGuideUrl == "" ? (
                  ""
                ) : (
                  <a href={resource.userGuideUrl} target="_blank" rel="noreferrer">
                    Link to User Guide
                  </a>
                )}
              </td>
            </tr>
            <tr>
              <td className="pr-2 font-bold">Features Available:</td>
              <td>{renderFeatures(resource.resourceId, resource.features)}</td>
            </tr>
          </tbody>
        </table>
        {renderDescription("Resource Description", resource.resourceDescription)}
        {renderDescription("Allocations Description", resource.description)}
        {renderDescription("Recommended Use", resource.recommendedUse)}
      </AccordionContent>
    </AccordionItem>
  );
};

export default Resource;
