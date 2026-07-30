import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PublicationEdit from "./PublicationEdit";
import {
  publicationIdAtom,
  saveEnabledAtom,
  savePublicationAtom,
  showEditModalAtom,
} from "./atoms";

export default function PublicationEditModal() {
  const show = useAtomValue(showEditModalAtom);
  const setShow = useSetAtom(showEditModalAtom);
  const publicationId = useAtomValue(publicationIdAtom);
  const canSave = useAtomValue(saveEnabledAtom);
  const savePublication = useSetAtom(savePublicationAtom);

  const handleModalHide = (save: boolean) => {
    if (save) savePublication();
    setShow(false);
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleModalHide(false)}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{publicationId ? "Edit" : "Add"} Publication</DialogTitle>
        </DialogHeader>
        <PublicationEdit />
        <DialogFooter>
          <Button variant="destructive" onClick={() => handleModalHide(false)}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={() => canSave && handleModalHide(true)}>
            Save Publication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
