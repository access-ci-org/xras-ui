import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { grantNumberAtom, grantSearchAtom } from "./atoms";

export default function ProjectSearch() {
  const grantNumber = useAtomValue(grantNumberAtom);
  const setGrantNumber = useSetAtom(grantNumberAtom);
  const grantSearch = useSetAtom(grantSearchAtom);

  return (
    <div>
      If your project isn&apos;t listed above, you can manually add it by entering the grant
      number below.
      <div className="mt-1 flex gap-2">
        <Input
          value={grantNumber}
          onChange={(e) => setGrantNumber(e.target.value)}
          placeholder="Enter a grant number"
        />
        <Button onClick={() => grantSearch()}>Find Project</Button>
      </div>
    </div>
  );
}
