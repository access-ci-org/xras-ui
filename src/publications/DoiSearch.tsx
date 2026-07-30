import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doiAtom, doiLookupAtom, updatePublicationFieldAtom } from "./atoms";

export default function DoiSearch() {
  const doi = useAtomValue(doiAtom);
  const updatePublicationField = useSetAtom(updatePublicationFieldAtom);
  const doiLookup = useSetAtom(doiLookupAtom);

  return (
    <div className="mb-3">
      <Label htmlFor="doi">DOI</Label>
      <div className="flex gap-2">
        <Input
          id="doi"
          name="publication[doi]"
          aria-label="DOI Input and Search box"
          value={doi}
          onChange={(e) => updatePublicationField({ key: "doi", value: e.target.value })}
        />
        <Button type="button" onClick={() => doiLookup()}>
          Lookup Publication
        </Button>
      </div>
    </div>
  );
}
