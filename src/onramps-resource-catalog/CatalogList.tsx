import { useSetAtom } from "jotai";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toggleCatalogAtom } from "./atoms";
import type { Catalog } from "./types";

const CatalogList = ({ catalogs }: { catalogs: Catalog[] }) => {
  const toggleCatalog = useSetAtom(toggleCatalogAtom);

  return (
    <div>
      <div className="mb-1 mt-1 font-bold">Catalogs</div>
      {catalogs.map((catalog) => (
        <div className="flex items-center gap-2" key={`catalog_${catalog.catalogId}`}>
          <Checkbox
            id={`catalog_${catalog.catalogId}`}
            checked={catalog.selected}
            onCheckedChange={(checked) => toggleCatalog({ catalog, selected: checked === true })}
          />
          <Label htmlFor={`catalog_${catalog.catalogId}`} className="font-normal">
            {catalog.catalogLabel}
          </Label>
        </div>
      ))}
    </div>
  );
};

export default CatalogList;
