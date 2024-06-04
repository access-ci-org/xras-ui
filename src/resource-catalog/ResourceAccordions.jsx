import { useSelector } from "react-redux";
import ResourceAccordion from "./ResourceAccordion";
import { selectResources } from "./helpers/catalogSlice";
import Accordion from "react-bootstrap/Accordion";

const ResourceAccordions = () => {
  const resources = useSelector(selectResources);

  if (resources.length == 0) {
    return <div className="fw-bold">No Resources Match Your Filters</div>;
  }

  return (
    <div>
      <h4 className="mb-0">Resources</h4>
      <Accordion>
        {resources.map((r) => (
          <ResourceAccordion resource={r} key={r.resourceId} />
        ))}
      </Accordion>
    </div>
  );
};

export default ResourceAccordions;
