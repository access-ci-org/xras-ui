import { useAtomValue } from "jotai";
import { Accordion } from "@/components/ui/accordion";
import Resource from "./Resource";
import { filteredResourcesAtom } from "./atoms";

const ResourceList = () => {
  const resources = useAtomValue(filteredResourcesAtom);

  if (resources.length == 0) {
    return <div className="font-bold">No Resources Match Your Filters</div>;
  }

  return (
    <div>
      <h4 className="mb-0">Resources</h4>
      <Accordion type="multiple">
        {resources.map((r) => (
          <Resource resource={r} key={r.resourceId} />
        ))}
      </Accordion>
    </div>
  );
};

export default ResourceList;
