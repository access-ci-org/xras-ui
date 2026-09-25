import { useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { editPublicationAtom } from "./atoms";

export default function PublicationAddButton() {
  const editPublication = useSetAtom(editPublicationAtom);

  return <Button onClick={() => editPublication(null)}>Add a New Publication</Button>;
}
